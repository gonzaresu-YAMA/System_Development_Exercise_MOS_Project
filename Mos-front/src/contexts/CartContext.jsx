/**
 * contexts/CartContext.jsx — カート共有用の Context オブジェクト定義
 *
 * React の「Context（コンテキスト）」とは、コンポーネントのツリー全体に
 * データを渡すための仕組みです。
 *
 * 通常、親から子へデータを渡すには props を使いますが、
 * 階層が深くなると「props のバケツリレー」が発生して管理が大変になります。
 * Context を使うと、間の階層を飛び越えてデータを共有できます。
 *
 * ─ このファイルの役割 ──────────────────────────────────
 * createContext() で Context オブジェクトを「作るだけ」のファイルです。
 * 実際のデータ（カートの商品リストや操作関数）は、
 * src/CartContext.jsx の CartProvider コンポーネントが提供します。
 *
 * ─ 使い方の流れ ─────────────────────────────────────────
 *   1. CartContext（このファイル）で Context を作る
 *   2. CartProvider（src/CartContext.jsx）が値を Context に入れる
 *   3. 任意のコンポーネントが useContext(CartContext) で値を取り出す
 */

import { createContext } from 'react'

// createContext(null): 初期値 null で Context を作成する
// → CartProvider が値をセットするまでは null になる
// → useContext(CartContext) を CartProvider の外で使った場合、null が返る
export const CartContext = createContext(null)
