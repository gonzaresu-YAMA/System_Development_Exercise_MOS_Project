import oshiboriImage from '../assets/おしぼり.png'
import glassImage from '../assets/グラス.png'
import waribashiImage from '../assets/割りばし.png'
import kozaraImage from '../assets/小皿.png'

const menuItems = [
  { id: 1, name: 'おしぼり', price: 0, image: oshiboriImage, soldOut: false, category: 'free' },
  { id: 2, name: '小皿', price: 0, image: kozaraImage, soldOut: true, category: 'free' },
  { id: 3, name: 'グラス', price: 0, image: glassImage, soldOut: true, category: 'free' },
  { id: 4, name: '割り箸', price: 0, image: waribashiImage, soldOut: true, category: 'free' },
  { id: 5, name: 'お冷', price: 0, image: '', soldOut: true, category: 'free' },
  { id: 6, name: '追加1', price: 0, image: '', soldOut: false, category: 'free' },
  { id: 7, name: '追加2', price: 0, image: '', soldOut: false, category: 'free' },
  { id: 8, name: '追加3', price: 0, image: '', soldOut: false, category: 'free' },
  { id: 9, name: 'ねぎま', price: 180, image: '', soldOut: false, category: 'yakitori' },
  { id: 10, name: 'もも', price: 180, image: '', soldOut: false, category: 'yakitori' },
  { id: 11, name: 'かわ', price: 160, image: '', soldOut: false, category: 'yakitori' },
  { id: 12, name: 'つくね', price: 200, image: '', soldOut: false, category: 'yakitori' },
  { id: 13, name: 'ぼんじり', price: 190, image: '', soldOut: false, category: 'yakitori' },
  { id: 14, name: '焼きおにぎり', price: 260, image: '', soldOut: false, category: 'rice' },
  { id: 15, name: '鶏雑炊', price: 420, image: '', soldOut: false, category: 'rice' },
  { id: 16, name: '鶏そぼろ丼', price: 480, image: '', soldOut: false, category: 'rice' },
  { id: 17, name: '親子丼', price: 520, image: '', soldOut: false, category: 'rice' },
  { id: 18, name: '明太ごはん', price: 380, image: '', soldOut: false, category: 'rice' },
  { id: 19, name: '枝豆', price: 280, image: '', soldOut: false, category: 'speed' },
  { id: 20, name: '冷奴', price: 260, image: '', soldOut: false, category: 'speed' },
  { id: 21, name: '漬けキュウリ', price: 300, image: '', soldOut: false, category: 'speed' },
  { id: 22, name: '塩キャベツ', price: 280, image: '', soldOut: false, category: 'speed' },
  { id: 23, name: 'もやしのナムル', price: 280, image: '', soldOut: false, category: 'speed' },
  { id: 24, name: '生ビール（中）', price: 520, image: '', soldOut: false, category: 'drink' },
  { id: 25, name: 'ハイボール', price: 480, image: '', soldOut: false, category: 'drink' },
  { id: 26, name: 'レモンサワー', price: 480, image: '', soldOut: false, category: 'drink' },
  { id: 27, name: 'ウーロン茶', price: 300, image: '', soldOut: false, category: 'drink' },
  { id: 28, name: 'コーラ', price: 300, image: '', soldOut: false, category: 'drink' },
  { id: 29, name: 'バニラアイス', price: 320, image: '', soldOut: false, category: 'dessert' },
  { id: 30, name: '抹茶アイス', price: 320, image: '', soldOut: false, category: 'dessert' },
  { id: 31, name: '黒蜜きなこアイス', price: 380, image: '', soldOut: false, category: 'dessert' },
  { id: 32, name: 'みたらし団子', price: 360, image: '', soldOut: false, category: 'dessert' },
  { id: 33, name: '杏仁豆腐', price: 360, image: '', soldOut: false, category: 'dessert' }
]

export default menuItems
