package com.midori.mos_backend.Service;

import com.midori.mos_backend.DTO.UserResponse;
import com.midori.mos_backend.entity.User;
import com.midori.mos_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

//データベースから取得した生のデータ（Entity）を、フロントエンド用のデータ（DTO）に加工するなどの「業務処理」を行います。
@Service
public class UserService {

    // Repositoryをインジェクション（利用可能に）する
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // IDを指定してユーザーを取得し、DTOに変換して返すメソッド
    public UserResponse getUserById(Long id) {
        // DBから検索（いなければ例外を投げる）
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

        // EntityのデータをDTOに詰め替える（パスワードは含めない）
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}