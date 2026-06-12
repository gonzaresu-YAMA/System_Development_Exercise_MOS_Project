package com.midori.mos_backend.DTO;

//フロントエンドへ返す専用のデータ構造（レスポンス）です。パスワードなどの中身を隠し、安全なデータだけを定義します。
/**
 * フロントへ返すデータの形式
 */
public class UserResponse {
    private Long id;
    private String name;
    private String email;

    // コンストラクタ
    public UserResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // ゲッター（SpringがJSONに変換する際に必要）
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}