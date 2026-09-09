'use client';

import { type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Command,
  CreditCard,
  Download,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  customerSegments,
  initialOrders,
  inventory,
  type Order,
  type OrderStatus,
  settlements,
  shippingStages,
} from '@/lib/commerce-data';

type ViewId = 'dashboard' | 'orders' | 'inventory' | 'shipping' | 'settlements' | 'customers';

type ToolRegistration = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};

type ModelContext = {
  registerTool: (tool: ToolRegistration, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

const navigation = [
  { id: 'dashboard' as const, label: '대시보드', icon: LayoutDashboard },
  { id: 'orders' as const, label: '주문 관리', icon: ClipboardList },
  { id: 'inventory' as const, label: '상품·재고', icon: Boxes },
  { id: 'shipping' as const, label: '배송 관리', icon: PackageCheck },
  { id: 'settlements' as const, label: '정산 관리', icon: CreditCard },
  { id: 'customers' as const, label: '고객 관리', icon: Users },
];

const viewCopy: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: 'Overview', title: '운영 대시보드', description: '핵심 지표와 처리해야 할 운영 이슈를 한눈에 확인하세요.' },
  orders: { eyebrow: 'Order Management', title: '주문 관리', description: '모든 판매 채널의 주문을 한곳에서 조회하고 처리합니다.' },
  inventory: { eyebrow: 'Inventory Control', title: '상품·재고', description: '판매 속도와 안전재고를 기준으로 품절 위험을 관리합니다.' },
  shipping: { eyebrow: 'Fulfillment', title: '배송 관리', description: '결제부터 배송 완료까지 전체 물류 흐름을 추적합니다.' },
  settlements: { eyebrow: 'Settlement', title: '정산 관리', description: '채널별 매출과 수수료, 정산 예정 금액을 검증합니다.' },
  customers: { eyebrow: 'Customer Intelligence', title: '고객 관리', description: '구매 행동을 기준으로 고객군과 관계를 관리합니다.' },
};

const statusClass: Record<OrderStatus, string> = {
  '출고 준비': 'border-blue-200 bg-blue-50 text-blue-700',
  '결제 완료': 'border-violet-200 bg-violet-50 text-violet-700',
  '배송 중': 'border-amber-200 bg-amber-50 text-amber-700',
  '확인 필요': 'border-red-200 bg-red-50 text-red-700',
  '배송 완료': 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const activity = [34, 48, 41, 57, 53, 68, 72, 61, 79, 76, 92, 84];

function won(value: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
}

export function CommerceOpsApp() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'전체' | OrderStatus>('전체');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalized || [order.id, order.customer, order.product, order.channel].some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = statusFilter === '전체' || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportError = () => undefined;

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'filter_orders',
            title: '주문 검색',
            description: '고객명, 주문번호, 상품명 또는 판매 채널로 주문을 검색하고 주문 관리 화면에 결과를 표시합니다.',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string', minLength: 1 } },
              required: ['query'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              const value = (input as { query?: unknown }).query;
              if (typeof value !== 'string' || !value.trim()) throw new Error('검색어를 입력하세요.');
              const trimmed = value.trim();
              setQuery(trimmed);
              setActiveView('orders');
              const resultCount = orders.filter((order) => [order.id, order.customer, order.product, order.channel].some((field) => field.toLowerCase().includes(trimmed.toLowerCase()))).length;
              return { query: trimmed, resultCount };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(reportError);

      void Promise.resolve(
        context.registerTool(
          {
            name: 'mark_order_ready_to_ship',
            title: '주문 출고 준비 처리',
            description: '주문번호에 해당하는 주문 상태를 출고 준비로 변경하고 화면에 반영합니다.',
            inputSchema: {
              type: 'object',
              properties: { orderId: { type: 'string', pattern: '^ORD-[0-9]+$' } },
              required: ['orderId'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              const orderId = (input as { orderId?: unknown }).orderId;
              if (typeof orderId !== 'string') throw new Error('올바른 주문번호가 필요합니다.');
              const found = orders.some((order) => order.id === orderId);
              if (!found) throw new Error('주문을 찾을 수 없습니다.');
              setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status: '출고 준비' } : order));
              setNotice(`${orderId} 주문이 출고 준비로 변경되었습니다.`);
              return { orderId, status: '출고 준비' };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(reportError);
    } catch {
      reportError();
    }
    return () => lifecycle.abort();
  }, [orders]);

  const moveTo = (view: ViewId) => {
    setActiveView(view);
    setMobileOpen(false);
    if (view !== 'orders') setQuery('');
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    setNotice(`${id} 주문 상태를 '${status}'로 변경했습니다.`);
  };

  const createOrder = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = form.get('customer');
    const product = form.get('product');
    const channel = form.get('channel');
    const amountValue = form.get('amount');
    if (typeof customer !== 'string' || typeof product !== 'string' || typeof channel !== 'string' || typeof amountValue !== 'string') return;
    const amount = Number(amountValue);
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-7)}`,
      customer,
      product,
      channel,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      amount,
      status: '결제 완료',
    };
    setOrders((current) => [order, ...current]);
    setDialogOpen(false);
    setActiveView('orders');
    setNotice(`${order.id} 신규 주문을 등록했습니다.`);
  };

  const activeCopy = viewCopy[activeView];

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#17201d]">
      {mobileOpen && <button aria-label="모바일 메뉴 닫기" className="fixed inset-0 z-30 bg-[#10251f]/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <Sidebar activeView={activeView} mobileOpen={mobileOpen} onNavigate={moveTo} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#dfe3dd] bg-[#f4f5f2]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" aria-label="메뉴 열기" className="rounded-xl bg-white lg:hidden" onClick={() => setMobileOpen(true)}><Menu /></Button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7e8a85]">{activeCopy.eyebrow}</p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-[-0.035em]">{activeCopy.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7a8580]" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); if (event.target.value) setActiveView('orders'); }}
                aria-label="주문과 상품 검색"
                placeholder="주문·상품 검색"
                className="h-9 w-[260px] rounded-xl border-[#d9ded8] bg-white pl-9 pr-12 text-xs shadow-sm"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#dfe3dd] bg-[#f7f8f6] px-1.5 py-0.5 font-mono text-[9px] text-[#8a9490]">⌘ K</kbd>
            </div>
            <Button className="h-9 rounded-xl bg-[#172d26] px-3 hover:bg-[#284a3f] sm:px-4" onClick={() => setDialogOpen(true)}><Plus className="size-4" /><span className="hidden sm:inline">주문 등록</span></Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.045em]">{activeCopy.title}</h2>
            <p className="mt-1 text-sm text-[#7b8581]">{activeCopy.description}</p>
          </div>

          {activeView === 'dashboard' && <DashboardView orders={orders} onNavigate={moveTo} />}
          {activeView === 'orders' && <OrdersView orders={filteredOrders} query={query} statusFilter={statusFilter} onQuery={setQuery} onFilter={setStatusFilter} onStatus={updateStatus} />}
          {activeView === 'inventory' && <InventoryView />}
          {activeView === 'shipping' && <ShippingView orders={orders} onStatus={updateStatus} />}
          {activeView === 'settlements' && <SettlementsView />}
          {activeView === 'customers' && <CustomersView />}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl p-5 sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-lg tracking-[-0.03em]">신규 주문 등록</DialogTitle><DialogDescription>전화 또는 오프라인으로 접수한 주문을 운영 시스템에 등록합니다.</DialogDescription></DialogHeader>
          <form onSubmit={createOrder} className="mt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="고객명"><Input name="customer" required placeholder="예: 홍길동" className="h-10" /></Field>
              <Field label="판매 채널"><select name="channel" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-ring" defaultValue="자사몰"><option>자사몰</option><option>29CM</option><option>무신사</option><option>스마트스토어</option></select></Field>
            </div>
            <Field label="상품명"><Input name="product" required placeholder="상품명을 입력하세요" className="h-10" /></Field>
            <Field label="결제금액"><Input name="amount" required type="number" min="1000" step="1000" placeholder="원 단위로 입력" className="h-10" /></Field>
            <DialogFooter className="-mx-5 -mb-5 mt-6 px-5 py-4"><Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setDialogOpen(false)}>취소</Button><Button type="submit" className="h-9 rounded-xl bg-[#172d26]">주문 등록</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {notice && <output aria-live="polite" className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-[#10251f] px-4 py-3 text-xs font-medium text-white shadow-2xl"><Check className="size-4 text-[#d6f36a]" />{notice}</output>}
    </main>
  );
}

function Sidebar({ activeView, mobileOpen, onNavigate, onClose }: { activeView: ViewId; mobileOpen: boolean; onNavigate: (view: ViewId) => void; onClose: () => void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col bg-[#10251f] text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="grid size-9 place-items-center rounded-xl bg-[#d6f36a] text-[#10251f]"><Command className="size-5" strokeWidth={2.4} /></div>
        <div className="flex-1"><p className="text-[15px] font-semibold tracking-[-0.02em]">Commerce Ops</p><p className="text-[11px] text-white/45">Operations control center</p></div>
        <button aria-label="메뉴 닫기" onClick={onClose} className="lg:hidden"><X className="size-5 text-white/60" /></button>
      </div>
      <nav aria-label="주요 메뉴" className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Workspace</p>
        <div className="space-y-1">
          {navigation.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={activeView === item.id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${activeView === item.id ? 'bg-white/10 font-medium text-white' : 'text-white/58 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className={`size-[17px] ${activeView === item.id ? 'text-[#d6f36a]' : ''}`} />{item.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-white/58 hover:bg-white/5 hover:text-white"><Settings className="size-[17px]" />환경 설정</button>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.055] p-3"><div className="grid size-9 place-items-center rounded-full bg-[#d6f36a] text-xs font-bold text-[#10251f]">CJ</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">최진원</p><p className="truncate text-[10px] text-white/40">Platform Admin</p></div><ChevronDown className="size-4 text-white/35" /></div>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#56615c]">{label}</span>{children}</label>;
}

function DashboardView({ orders, onNavigate }: { orders: Order[]; onNavigate: (view: ViewId) => void }) {
  const metrics = [
    { label: '오늘 주문', value: '1,284', change: '+12.8%', detail: '어제 같은 시간 대비', direction: 'up' },
    { label: '결제 완료', value: '₩84.2M', change: '+8.4%', detail: '승인율 98.7%', direction: 'up' },
    { label: '출고 대기', value: '146', change: '-18건', detail: '처리 목표 2시간', direction: 'down' },
    { label: '재고 위험', value: '12', change: '3건 증가', detail: '안전재고 미만 SKU', direction: 'risk' },
  ];
  return <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-[#dfe3dd] bg-white p-5 shadow-[0_1px_2px_rgb(16_37_31/3%)]"><p className="text-xs font-medium text-[#7d8782]">{metric.label}</p><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-[27px] font-semibold tracking-[-0.045em]">{metric.value}</strong><span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${metric.direction === 'risk' ? 'text-red-600' : 'text-emerald-700'}`}>{metric.direction === 'up' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{metric.change}</span></div><p className="mt-2 text-[11px] text-[#9aa29f]">{metric.detail}</p></article>)}
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
      <section className="rounded-2xl border border-[#dfe3dd] bg-white p-5 shadow-[0_1px_2px_rgb(16_37_31/3%)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">시간대별 주문 흐름</p><p className="mt-1 text-xs text-[#8a9490]">오늘 00:00–현재</p></div><Badge variant="outline" className="h-7 rounded-lg border-[#dce1db] px-2.5 text-[11px] text-[#65706b]">시간별</Badge></div><div className="mt-6 flex h-[166px] items-end gap-2 border-b border-[#e5e8e4] sm:gap-3">{activity.map((height, index) => <div key={index} className="group flex h-full flex-1 items-end"><div className={`w-full rounded-t-[5px] transition-colors ${index === activity.length - 2 ? 'bg-[#244e40]' : 'bg-[#dfe9e4] group-hover:bg-[#b9cfc5]'}`} style={{ height: `${height}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-[#9ba4a0]"><span>00시</span><span>04시</span><span>08시</span><span>12시</span><span>16시</span><span>20시</span></div></section>
      <section className="rounded-2xl bg-[#19352c] p-5 text-white shadow-[0_10px_28px_rgb(16_37_31/14%)] sm:p-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold">운영 신호</p><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/60">3건 확인 필요</span></div><div className="mt-5 space-y-3"><button onClick={() => onNavigate('inventory')} className="flex w-full gap-3 rounded-xl bg-white/[0.07] p-3 text-left hover:bg-white/10"><CircleAlert className="mt-0.5 size-4 shrink-0 text-[#ffcd67]" /><span><span className="block text-xs font-medium">SKU 12개가 안전재고 미만입니다</span><span className="mt-1 block text-[10px] text-white/48">판매 속도 기준 24시간 내 품절 예상</span></span></button><button onClick={() => onNavigate('orders')} className="flex w-full gap-3 rounded-xl bg-white/[0.07] p-3 text-left hover:bg-white/10"><ShoppingBag className="mt-0.5 size-4 shrink-0 text-[#9dd6ff]" /><span><span className="block text-xs font-medium">주문 8건의 주소 확인이 필요합니다</span><span className="mt-1 block text-[10px] text-white/48">출고 마감까지 1시간 18분</span></span></button><button onClick={() => onNavigate('settlements')} className="flex w-full gap-3 rounded-xl bg-white/[0.07] p-3 text-left hover:bg-white/10"><CircleCheck className="mt-0.5 size-4 shrink-0 text-[#d6f36a]" /><span><span className="block text-xs font-medium">새벽 정산 배치가 완료되었습니다</span><span className="mt-1 block text-[10px] text-white/48">총 2,842건 · 오류 0건</span></span></button></div></section>
    </div>
    <OrderTable title="최근 주문" description="실시간으로 유입되는 주문 처리 현황입니다." orders={orders.slice(0, 5)} onViewAll={() => onNavigate('orders')} />
  </>;
}

function OrdersView({ orders, query, statusFilter, onQuery, onFilter, onStatus }: { orders: Order[]; query: string; statusFilter: '전체' | OrderStatus; onQuery: (value: string) => void; onFilter: (value: '전체' | OrderStatus) => void; onStatus: (id: string, status: OrderStatus) => void }) {
  const filters: Array<'전체' | OrderStatus> = ['전체', '결제 완료', '출고 준비', '배송 중', '확인 필요', '배송 완료'];
  return <section className="rounded-2xl border border-[#dfe3dd] bg-white shadow-[0_1px_2px_rgb(16_37_31/3%)]"><div className="flex flex-col gap-3 border-b border-[#e3e6e2] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b9590]" /><Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="주문번호, 고객, 상품 검색" className="h-9 w-full rounded-xl bg-[#f8faf7] pl-9 text-xs sm:w-[300px]" /></div><div className="flex gap-1 overflow-x-auto">{filters.map((filter) => <button key={filter} onClick={() => onFilter(filter)} className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium ${statusFilter === filter ? 'bg-[#19352c] text-white' : 'bg-[#f3f5f2] text-[#68736e] hover:bg-[#e8ece8]'}`}>{filter}</button>)}</div></div><OrderRows orders={orders} onStatus={onStatus} /><div className="flex items-center justify-between border-t border-[#e8ebe7] px-6 py-4 text-[11px] text-[#89928e]"><span>총 {orders.length}건</span><span>데모 데이터 · 실시간 필터 적용</span></div></section>;
}

function InventoryView() {
  return <><div className="grid gap-3 sm:grid-cols-3"><StatCard label="전체 SKU" value="1,842" note="활성 상품 1,796개" /><StatCard label="안전재고 미만" value="12" note="긴급 보충 3개" danger /><StatCard label="재고 회전율" value="6.8회" note="전월 대비 +0.4" /></div><section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white"><SectionHeader title="재고 위험 모니터링" description="최근 7일 판매 속도와 현재 가용재고를 비교합니다." action="발주 제안 내보내기" /><Table><TableHeader><TableRow className="bg-[#fafbf9] hover:bg-[#fafbf9]"><Head>SKU</Head><Head>상품명</Head><Head>카테고리</Head><Head>현재 재고</Head><Head>안전재고</Head><Head>7일 판매</Head><Head>상태</Head></TableRow></TableHeader><TableBody>{inventory.map((item) => <TableRow key={item.sku} className="border-[#eceeeb]"><TableCell className="px-6 font-mono text-[11px] font-semibold text-[#315d4e]">{item.sku}</TableCell><TableCell className="text-xs font-medium">{item.name}</TableCell><TableCell className="text-xs text-[#79837e]">{item.category}</TableCell><TableCell><div className="w-28"><div className="mb-1 flex justify-between text-[10px]"><span className="font-semibold">{item.stock}</span><span className="text-[#9ba39f]">100</span></div><div className="h-1.5 rounded-full bg-[#edf0ed]"><div className={`h-full rounded-full ${item.stock < item.safety ? 'bg-red-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(item.stock, 100)}%` }} /></div></div></TableCell><TableCell className="text-xs">{item.safety}</TableCell><TableCell className="text-xs">{item.sales}</TableCell><TableCell><Badge variant="outline" className={`rounded-md ${item.state === '긴급' ? 'border-red-200 bg-red-50 text-red-700' : item.state === '주의' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{item.state}</Badge></TableCell></TableRow>)}</TableBody></Table></section></>;
}

function ShippingView({ orders, onStatus }: { orders: Order[]; onStatus: (id: string, status: OrderStatus) => void }) {
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{shippingStages.map((stage, index) => <article key={stage.label} className="relative overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white p-5"><div className={`mb-4 grid size-9 place-items-center rounded-xl ${stage.tone}`}>{index === 4 ? <CircleCheck className="size-4" /> : <Truck className="size-4" />}</div><p className="text-xs text-[#7d8782]">{stage.label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{stage.count.toLocaleString()}<span className="ml-1 text-xs font-normal text-[#8a9490]">건</span></p></article>)}</div><section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white"><SectionHeader title="오늘 출고 대상" description="오후 2시 이전 주문은 오늘 출고를 목표로 합니다." action="송장 일괄 등록" /><OrderRows orders={orders.filter((order) => ['결제 완료', '출고 준비', '배송 중'].includes(order.status))} onStatus={onStatus} /></section></>;
}

function SettlementsView() {
  const total = settlements.reduce((sum, item) => sum + item.expected, 0);
  return <><div className="grid gap-3 sm:grid-cols-3"><StatCard label="정산 예정액" value={won(total)} note="향후 7일 입금 예정" /><StatCard label="플랫폼 수수료" value={won(settlements.reduce((sum, item) => sum + item.fee, 0))} note="평균 수수료율 9.1%" /><StatCard label="대사 차이" value="₩0" note="모든 채널 일치" /></div><section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white"><SectionHeader title="채널별 정산 현황" description="주문·취소·수수료 데이터를 자동으로 대사한 결과입니다." action="정산 리포트 다운로드" /><Table><TableHeader><TableRow className="bg-[#fafbf9] hover:bg-[#fafbf9]"><Head>판매 채널</Head><Head>정산 주기</Head><Head>총매출</Head><Head>수수료</Head><Head>정산 예정액</Head><Head>예정일</Head><Head>상태</Head></TableRow></TableHeader><TableBody>{settlements.map((item) => <TableRow key={item.channel} className="border-[#eceeeb]"><TableCell className="px-6 text-xs font-semibold">{item.channel}</TableCell><TableCell className="text-xs text-[#79837e]">{item.cycle}</TableCell><TableCell className="text-xs">{won(item.gross)}</TableCell><TableCell className="text-xs text-red-600">-{won(item.fee)}</TableCell><TableCell className="text-xs font-semibold">{won(item.expected)}</TableCell><TableCell className="text-xs">{item.date}</TableCell><TableCell><Badge variant="outline" className="rounded-md border-blue-200 bg-blue-50 text-blue-700">{item.state}</Badge></TableCell></TableRow>)}</TableBody></Table></section></>;
}

function CustomersView() {
  return <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><section className="rounded-2xl border border-[#dfe3dd] bg-white p-6"><div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold">고객 세그먼트</h3><p className="mt-1 text-xs text-[#8a9490]">최근 90일 구매 행동 기준</p></div><Badge variant="outline" className="rounded-lg">2,373명</Badge></div><div className="mt-8 flex h-3 overflow-hidden rounded-full">{customerSegments.map((segment) => <div key={segment.label} style={{ width: `${segment.share}%`, backgroundColor: segment.color }} />)}</div><div className="mt-7 grid gap-3 sm:grid-cols-2">{customerSegments.map((segment) => <article key={segment.label} className="rounded-xl border border-[#e3e7e2] p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold"><span className="size-2 rounded-full" style={{ background: segment.color }} />{segment.label}</span><span className="text-[10px] text-[#909995]">{segment.share}%</span></div><p className="mt-4 text-xl font-semibold">{segment.count.toLocaleString()}<span className="ml-1 text-xs font-normal text-[#8a9490]">명</span></p><p className="mt-1 text-[10px] text-[#8a9490]">평균 구매액 {segment.spend}</p></article>)}</div></section><section className="rounded-2xl bg-[#19352c] p-6 text-white"><p className="text-sm font-semibold">고객 인사이트</p><p className="mt-2 text-xs leading-5 text-white/55">재구매 가능성이 높은 고객과 이탈 위험 고객을 자동으로 탐지합니다.</p><div className="mt-7 space-y-3"><Insight value="142명" label="재구매 예상 고객" tone="text-[#d6f36a]" /><Insight value="38명" label="이탈 위험 고객" tone="text-[#ffbd73]" /><Insight value="₩186K" label="고객 평균 가치" tone="text-[#9dd6ff]" /></div><Button className="mt-7 h-10 w-full rounded-xl bg-white text-[#19352c] hover:bg-white/90">캠페인 대상 만들기</Button></section></div>;
}

function Insight({ value, label, tone }: { value: string; label: string; tone: string }) { return <div className="flex items-center justify-between rounded-xl bg-white/[0.07] px-4 py-3"><span className="text-xs text-white/55">{label}</span><strong className={`text-sm ${tone}`}>{value}</strong></div>; }

function StatCard({ label, value, note, danger = false }: { label: string; value: string; note: string; danger?: boolean }) { return <article className="rounded-2xl border border-[#dfe3dd] bg-white p-5"><p className="text-xs font-medium text-[#7d8782]">{label}</p><p className={`mt-3 text-[25px] font-semibold tracking-[-0.045em] ${danger ? 'text-red-600' : ''}`}>{value}</p><p className="mt-2 text-[11px] text-[#9aa29f]">{note}</p></article>; }

function SectionHeader({ title, description, action }: { title: string; description: string; action: string }) { return <div className="flex items-center justify-between border-b border-[#e3e6e2] px-5 py-4 sm:px-6"><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] text-[#8a9490]">{description}</p></div><Button variant="outline" className="hidden h-8 rounded-lg text-[11px] sm:flex"><Download className="size-3.5" />{action}</Button></div>; }

function Head({ children }: { children: React.ReactNode }) { return <TableHead className="h-10 px-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8e9793] first:px-6 last:pr-6">{children}</TableHead>; }

function OrderTable({ title, description, orders, onViewAll }: { title: string; description: string; orders: Order[]; onViewAll: () => void }) { return <section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white shadow-[0_1px_2px_rgb(16_37_31/3%)]"><div className="flex items-center justify-between border-b border-[#e3e6e2] px-5 py-4 sm:px-6"><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] text-[#8a9490]">{description}</p></div><button onClick={onViewAll} className="text-xs font-semibold text-[#315d4e] hover:text-[#19352c]">전체 주문 보기 →</button></div><OrderRows orders={orders} /></section>; }

function OrderRows({ orders, onStatus }: { orders: Order[]; onStatus?: (id: string, status: OrderStatus) => void }) {
  if (!orders.length) return <div className="grid min-h-64 place-items-center p-8 text-center"><div><Search className="mx-auto size-7 text-[#a2aaa6]" /><p className="mt-3 text-sm font-semibold">조건에 맞는 주문이 없습니다</p><p className="mt-1 text-xs text-[#8a9490]">검색어나 상태 필터를 변경해보세요.</p></div></div>;
  return <Table><TableHeader><TableRow className="border-[#e7e9e6] bg-[#fafbf9] hover:bg-[#fafbf9]"><Head>주문번호</Head><Head>고객</Head><Head>상품</Head><Head>채널</Head><Head>시각</Head><Head>결제금액</Head><Head>상태</Head>{onStatus && <Head>처리</Head>}</TableRow></TableHeader><TableBody>{orders.map((order) => <TableRow key={order.id} className="border-[#eceeeb] hover:bg-[#f8faf7]"><TableCell className="px-6 py-3.5 font-mono text-[11px] font-semibold text-[#2d5145]">{order.id}</TableCell><TableCell className="text-xs font-medium">{order.customer}</TableCell><TableCell className="max-w-[230px] truncate text-xs text-[#68736e]">{order.product}</TableCell><TableCell className="text-[11px] text-[#79837e]">{order.channel}</TableCell><TableCell className="text-xs text-[#89928e]">{order.time}</TableCell><TableCell className="text-xs font-semibold">{won(order.amount)}</TableCell><TableCell><Badge variant="outline" className={`h-6 rounded-md px-2 text-[10px] ${statusClass[order.status]}`}>{order.status}</Badge></TableCell>{onStatus && <TableCell className="pr-6"><select aria-label={`${order.id} 상태 변경`} value={order.status} onChange={(event) => onStatus(order.id, event.target.value as OrderStatus)} className="h-7 rounded-lg border border-[#dfe3dd] bg-white px-2 text-[10px] outline-none focus:border-[#315d4e]"><option>결제 완료</option><option>출고 준비</option><option>배송 중</option><option>확인 필요</option><option>배송 완료</option></select></TableCell>}</TableRow>)}</TableBody></Table>;
}
