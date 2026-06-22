package com.midori.mos_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String role = "employee";

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(name = "allowed_use_cases", nullable = false, length = 200)
    private String allowedUseCases = "hall,kitchen";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAllowedUseCases() { return allowedUseCases; }
    public void setAllowedUseCases(String allowedUseCases) { this.allowedUseCases = allowedUseCases; }

    /** カンマ区切り文字列をリストに変換して返す */
    public List<String> getAllowedUseCaseList() {
        if (allowedUseCases == null || allowedUseCases.isBlank()) return List.of();
        return Arrays.stream(allowedUseCases.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
