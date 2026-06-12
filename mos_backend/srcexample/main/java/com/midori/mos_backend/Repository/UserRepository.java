package com.midori.mos_backend.repository;

import com.midori.mos_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//データベースへのアクセスを担当します。Spring Data JPAを使う場合、インターフェースを定義するだけで自動的にSQLが生成されます。
@Repository
// JpaRepository<扱うEntity, 主キーの型> を継承する
public interface UserRepository extends JpaRepository<User, Long> {
    // データの検索や保存(findById, saveなど)の基本メソッドが自動で使える
}