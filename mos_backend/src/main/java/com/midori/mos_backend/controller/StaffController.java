package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Staff;
import com.midori.mos_backend.service.StaffService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<List<Staff>> getAll() {
        return ResponseEntity.ok(staffService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable String id) {
        return staffService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Staff> create(@RequestBody Staff staff) {
        return ResponseEntity.ok(staffService.create(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Staff> update(@PathVariable String id, @RequestBody Staff staff) {
        try {
            return ResponseEntity.ok(staffService.update(id, staff));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        staffService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * ログイン認証
     * リクエスト: { "id": "S000001", "password": "1111" }
     * 成功時: Staff オブジェクト (パスワードフィールドは含まない)
     */
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody Map<String, String> body) {
        String id = body.get("id");
        String password = body.get("password");

        return staffService.authenticate(id, password)
                .<ResponseEntity<?>>map(staff -> {
                    // パスワードを返さないように専用レスポンスを組み立てる
                    Map<String, Object> res = Map.of(
                            "id", staff.getId(),
                            "name", staff.getName(),
                            "role", staff.getRole(),
                            "active", staff.isActive(),
                            "allowedUseCases", staff.getAllowedUseCaseList()
                    );
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.status(401).body(Map.of("reason", "IDまたはパスワードが違います")));
    }
}
