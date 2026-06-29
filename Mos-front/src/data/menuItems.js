/**
 * data/menuItems.js — フロントエンド用の静的メニューデータ
 *
 * 「なぜ静的データをフロントに持つのか?」
 *   本来はバックエンド API からメニューを取得するのが理想だが、
 *   開発初期段階では静的データからスタートして動作確認しやすくした。
 *   画像は import で Vite のバンドル対象に含めることで、
 *   ビルド時に最適化（ハッシュ付きファイル名・圧縮）される。
 *
 * 各商品オブジェクトの構造:
 *   id:                 数値ID（バックエンドの menu_items.id と対応）
 *   name:               商品名
 *   price:              価格（円）。0 = 無料
 *   image:              import した画像モジュール（ビルド後は最適化された URL になる）
 *   soldOut:            売り切れフラグ。true のとき注文ボタンが無効になる
 *   category:           カテゴリID（下記参照）
 *   drinkPlanExcluded:  true の場合、飲み放題プランでも有料になる（生ビールなど）
 *
 * カテゴリID 一覧:
 *   'free'     → 無料備品（おしぼり・小皿・グラスなど）
 *   'yakitori' → 焼き鳥
 *   'rice'     → ごはんもの
 *   'speed'    → スピード（すぐ出る冷菜など）
 *   'drink'    → ドリンク
 *   'dessert'  → デザート
 */

// 画像ファイルを import で取り込む
// 文字列パス（例: '../assets/おしぼり.png'）を直接使う方法もあるが、
// import を使うと Vite がビルド時にファイルの存在チェックをしてくれるため安全
import oshiboriImage from '../assets/おしぼり.png'
import glassImage from '../assets/グラス.png'
import waribashiImage from '../assets/割りばし.png'
import kozaraImage from '../assets/小皿.png'
import negimaImage from '../assets/ねぎま.jpg'
import momoImage from '../assets/もも.jpg'
import kawaImage from '../assets/かわ.jpg'
import tsukuneImage from '../assets/つくね.jpg'
import bonjiriImage from '../assets/ぼんじり.jpg'
import yakionigiriImage from '../assets/焼きおにぎり.jpg'
import zousuiImage from '../assets/鳥雑炊.jpg'
import soboroDonImage from '../assets/鶏そぼろ丼.jpg'
import oyakoDonImage from '../assets/親子丼.jpg'
import mentaikoRiceImage from '../assets/明太ごはん.jpg'
import edamameImage from '../assets/枝豆.jpg'
import hiyayakkoImage from '../assets/冷奴.jpg'
import tsukemekyuriImage from '../assets/漬けキュウリ.jpg'
import yamitukiCabbageImage from '../assets/やみつきキャベツ.jpg'
import moyashiNamuruImage from '../assets/もやしのナムル.jpg'
import namaBeerImage from '../assets/生ビール.jpg'
import highballImage from '../assets/ハイボール.jpg'
import lemonSourImage from '../assets/レモンサワー.jpg'
import oolongTeaImage from '../assets/烏龍茶.jpg'
import colaImage from '../assets/コーラ.jpg'
import vanillaIceImage from '../assets/バニラアイス.jpg'
import matchaIceImage from '../assets/抹茶アイス.jpg'
import kinakoIceImage from '../assets/黒蜜きなこアイス.jpg'
import mitarashiDangoImage from '../assets/みたらし団子.jpg'
import anninToufuuImage from '../assets/杏仁豆腐.jpg'

// メニューアイテムの配列
// id はバックエンドの menu_items テーブルの id と対応させている
const menuItems = [
  // ── 無料備品（category: 'free'）──────────────────────────
  // 価格 0 円・注文可能な備品。お客様が必要に応じて追加注文できる。
  { id: 1, name: 'おしぼり',  price: 0, image: oshiboriImage,  soldOut: false, category: 'free' },
  { id: 2, name: '小皿',      price: 0, image: kozaraImage,    soldOut: false, category: 'free' },
  { id: 3, name: 'グラス',    price: 0, image: glassImage,     soldOut: false, category: 'free' },
  { id: 4, name: '割り箸',    price: 0, image: waribashiImage, soldOut: false, category: 'free' },
  // soldOut: true → 「売り切れ」ラベルが表示され、注文ボタンが無効になる
  { id: 5, name: 'お冷',      price: 0, image: '',             soldOut: true,  category: 'free' },

  // ── 焼き鳥（category: 'yakitori'）──────────────────────────
  { id: 9,  name: 'ねぎま',   price: 180, image: negimaImage,   soldOut: false, category: 'yakitori' },
  { id: 10, name: 'もも',     price: 180, image: momoImage,     soldOut: false, category: 'yakitori' },
  { id: 11, name: 'かわ',     price: 160, image: kawaImage,     soldOut: false, category: 'yakitori' },
  { id: 12, name: 'つくね',   price: 200, image: tsukuneImage,  soldOut: false, category: 'yakitori' },
  { id: 13, name: 'ぼんじり', price: 190, image: bonjiriImage,  soldOut: false, category: 'yakitori' },

  // ── ごはんもの（category: 'rice'）──────────────────────────
  { id: 14, name: '焼きおにぎり', price: 260, image: yakionigiriImage, soldOut: false, category: 'rice' },
  { id: 15, name: '鶏雑炊',      price: 420, image: zousuiImage,       soldOut: false, category: 'rice' },
  { id: 16, name: '鶏そぼろ丼',  price: 480, image: soboroDonImage,    soldOut: false, category: 'rice' },
  { id: 17, name: '親子丼',      price: 520, image: oyakoDonImage,     soldOut: false, category: 'rice' },
  { id: 18, name: '明太ごはん',  price: 380, image: mentaikoRiceImage, soldOut: false, category: 'rice' },

  // ── スピード（category: 'speed'）──────────────────────────
  // すぐ提供できる冷菜など。調理時間が短い商品をまとめたカテゴリ。
  { id: 19, name: '枝豆',         price: 280, image: edamameImage,       soldOut: false, category: 'speed' },
  { id: 20, name: '冷奴',         price: 260, image: hiyayakkoImage,     soldOut: false, category: 'speed' },
  { id: 21, name: '漬けキュウリ', price: 300, image: tsukemekyuriImage,  soldOut: false, category: 'speed' },
  { id: 22, name: 'やみつきキャベツ', price: 280, image: yamitukiCabbageImage, soldOut: false, category: 'speed' },
  { id: 23, name: 'もやしのナムル',  price: 280, image: moyashiNamuruImage,    soldOut: false, category: 'speed' },

  // ── ドリンク（category: 'drink'）──────────────────────────
  // 飲み放題プランでは基本的に価格を「飲み放題」と表示する。
  // drinkPlanExcluded: true の商品（生ビール）は飲み放題でも有料になる。
  { id: 24, name: '生ビール（中）', price: 520, image: namaBeerImage,  soldOut: false, category: 'drink', drinkPlanExcluded: true },
  { id: 25, name: 'ハイボール',    price: 480, image: highballImage,   soldOut: false, category: 'drink' },
  { id: 26, name: 'レモンサワー',  price: 480, image: lemonSourImage,  soldOut: false, category: 'drink' },
  { id: 27, name: 'ウーロン茶',    price: 300, image: oolongTeaImage,  soldOut: false, category: 'drink' },
  { id: 28, name: 'コーラ',        price: 300, image: colaImage,       soldOut: false, category: 'drink' },

  // ── デザート（category: 'dessert'）──────────────────────────
  { id: 29, name: 'バニラアイス',     price: 320, image: vanillaIceImage,  soldOut: false, category: 'dessert' },
  { id: 30, name: '抹茶アイス',       price: 320, image: matchaIceImage,   soldOut: false, category: 'dessert' },
  { id: 31, name: '黒蜜きなこアイス', price: 380, image: kinakoIceImage,   soldOut: false, category: 'dessert' },
  { id: 32, name: 'みたらし団子',     price: 360, image: mitarashiDangoImage, soldOut: false, category: 'dessert' },
  { id: 33, name: '杏仁豆腐',        price: 360, image: anninToufuuImage,  soldOut: false, category: 'dessert' }
]

export default menuItems
