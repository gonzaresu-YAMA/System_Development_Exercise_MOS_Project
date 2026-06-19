package com.midori.mos_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MosBackendApplicationTests {

    @Test
    @DisplayName("アプリケーションコンテキストが正常にロードされる")
    void contextLoads() {
    }
}
