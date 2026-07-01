package com.midori.mos_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS設定クラス
 * SpringSecurity等のセキュリティフィルターで利用するBeanを定義
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // デモ:ローカル開発環境のフロントエンドからのアクセスを許可
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000"
        ));

        // 許可するHTTPメソッドの設定
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // デモ:すべてのリクエストヘッダーを許可
        config.setAllowedHeaders(List.of("*"));

        // 認証情報(Cookieや認証ヘッダー)を含むCORS通信を許可
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // API設定(/api/以降のすべてのパス)に対して上記CORS設定を適用
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
