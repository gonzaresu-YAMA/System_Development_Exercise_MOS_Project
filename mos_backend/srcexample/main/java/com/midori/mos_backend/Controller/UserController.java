package com.midori.mos_backend.Controller;

import com.midori.mos_backend.DTO.UserResponse;
import com.midori.mos_backend.Service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//フロントエンドからのHTTPリクエストを最初に受け取り、Serviceを呼び出して、最終的にJSON形式で結果を返します。
@RestController                  // JSONを返すAPI用のコントローラ
@RequestMapping("/api/users")    // このURLのベースとなるパス
public class UserController {

    // Serviceをインジェクション（利用可能に）する
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET http://localhost:8080/api/users/{id} でアクセスされた時の処理
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        // Serviceの処理を呼び出して、結果（DTO）をそのまま返す（Springが自動でJSONに変換します）
        return userService.getUserById(id);
    }
}