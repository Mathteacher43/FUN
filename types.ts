
export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
  isActive?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  type: 'start' | 'move' | 'end';
}

export interface RoomState {
  code: string;
  status: 'waiting' | 'playing' | 'ended';
  drawerId: string | null;
  currentWord: string | null;
  timer: number;
  round: number;
  winner?: string;
}

export const WORDS = [
  "사과", "바나나", "고양이", "강아지", "컴퓨터", "우주선", "피자", "축구", "피아노", "눈사람",
  "비행기", "자동차", "아이스크림", "치킨", "무지개", "학교", "선생님", "의사", "경찰", "자전거",
  "카메라", "핸드폰", "시계", "안경", "도서관", "바다", "산", "나무", "꽃", "태양", "달", "별",
  "코끼리", "기린", "호랑이", "사자", "펭귄", "팬더", "토끼", "다람쥐", "거북이", "물고기", "나비",
  "벌", "개미", "거미", "지갑", "우산", "모자", "가방", "신발", "옷", "침대", "책상", "의자"
];
