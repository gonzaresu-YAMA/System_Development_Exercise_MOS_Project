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
  { id: 8, name: '追加3', price: 0, image: '', soldOut: false, category: 'free' }
]

export default menuItems
