export type OrderStatus = '출고 준비' | '결제 완료' | '배송 중' | '확인 필요' | '배송 완료';

export type Order = {
  id: string;
  customer: string;
  product: string;
  channel: string;
  time: string;
  amount: number;
  status: OrderStatus;
};

export const initialOrders: Order[] = [
  { id: 'ORD-2409138', customer: '한서윤', product: '오브제 울 블렌드 재킷', channel: '자사몰', time: '10:42', amount: 189000, status: '출고 준비' },
  { id: 'ORD-2409137', customer: '박도현', product: '시그니처 레더 토트백', channel: '무신사', time: '10:38', amount: 248000, status: '결제 완료' },
  { id: 'ORD-2409136', customer: '이하린', product: '클래식 코튼 셔츠 외 1건', channel: '29CM', time: '10:31', amount: 143000, status: '배송 중' },
  { id: 'ORD-2409135', customer: '김우진', product: '에센셜 캐시미어 니트', channel: '자사몰', time: '10:29', amount: 129000, status: '확인 필요' },
  { id: 'ORD-2409134', customer: '정민서', product: '모던 테이퍼드 팬츠', channel: '스마트스토어', time: '10:21', amount: 98000, status: '배송 완료' },
  { id: 'ORD-2409133', customer: '오지후', product: '미니멀 스웨이드 로퍼', channel: '자사몰', time: '10:18', amount: 168000, status: '출고 준비' },
  { id: 'ORD-2409132', customer: '윤가은', product: '소프트 메리노 카디건', channel: '29CM', time: '10:04', amount: 118000, status: '결제 완료' },
  { id: 'ORD-2409131', customer: '장시우', product: '데일리 옥스퍼드 셔츠', channel: '무신사', time: '09:58', amount: 89000, status: '배송 중' },
];

export const inventory = [
  { sku: 'JK-OB-402', name: '오브제 울 블렌드 재킷', category: '아우터', stock: 8, safety: 20, sales: 42, state: '긴급' },
  { sku: 'KN-CM-118', name: '에센셜 캐시미어 니트', category: '니트', stock: 14, safety: 25, sales: 36, state: '주의' },
  { sku: 'BG-LT-221', name: '시그니처 레더 토트백', category: '가방', stock: 17, safety: 18, sales: 29, state: '주의' },
  { sku: 'SH-CT-173', name: '클래식 코튼 셔츠', category: '셔츠', stock: 64, safety: 30, sales: 21, state: '안정' },
  { sku: 'PT-TP-093', name: '모던 테이퍼드 팬츠', category: '팬츠', stock: 82, safety: 35, sales: 18, state: '안정' },
  { sku: 'CD-MR-205', name: '소프트 메리노 카디건', category: '니트', stock: 31, safety: 24, sales: 27, state: '안정' },
];

export const settlements = [
  { channel: '자사몰', cycle: '매일', gross: 42840000, fee: 1250000, expected: 41590000, date: '09.10', state: '정산 예정' },
  { channel: '29CM', cycle: '주 1회', gross: 18760000, fee: 2814000, expected: 15946000, date: '09.12', state: '검수 중' },
  { channel: '무신사', cycle: '주 1회', gross: 24320000, fee: 3405000, expected: 20915000, date: '09.12', state: '검수 중' },
  { channel: '스마트스토어', cycle: '영업일+1', gross: 12690000, fee: 571000, expected: 12119000, date: '09.10', state: '정산 예정' },
];

export const shippingStages = [
  { label: '결제 확인', count: 82, tone: 'bg-violet-100 text-violet-700' },
  { label: '상품 준비', count: 146, tone: 'bg-blue-100 text-blue-700' },
  { label: '집화 완료', count: 231, tone: 'bg-cyan-100 text-cyan-700' },
  { label: '배송 중', count: 684, tone: 'bg-amber-100 text-amber-700' },
  { label: '배송 완료', count: 1928, tone: 'bg-emerald-100 text-emerald-700' },
];

export const customerSegments = [
  { label: 'VIP', count: 328, share: 14, spend: '₩428K', color: '#19352c' },
  { label: '충성 고객', count: 684, share: 29, spend: '₩216K', color: '#477566' },
  { label: '성장 고객', count: 812, share: 34, spend: '₩128K', color: '#89aa9e' },
  { label: '신규 고객', count: 549, share: 23, spend: '₩72K', color: '#c8d8d2' },
];
