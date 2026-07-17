package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.dto.MenuItemRequest;
import com.midori.mos_backend.service.MenuService;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    // ── カテゴリ ─────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    // ── タグ ─────────────────────────────────────────────

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getTags() {
        return ResponseEntity.ok(menuService.getAllTags());
    }

    // ── メニュー商品（読み取り）───────────────────────────

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false, defaultValue = "false") boolean all
    ) {
        List<MenuItem> result;
        if (all) {
            result = menuService.getAllItems();
        }
        else if (category != null) {
            result = menuService.getItemsByCategory(category);
        }
        else if (minPrice != null && maxPrice != null) {
            result = menuService.getItemsByPriceRange(minPrice,maxPrice);
        }
        else
        {
            result = menuService.getAllAvailableItems();
        }
        // 在庫・価格・売り切れ状態は頻繫に変わるため、ブラウザ/プロキシに一切キャッシュされない
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(result);
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<MenuItem>> searchItems(@RequestParam String keyword) {
        return ResponseEntity.ok(menuService.searchItems(keyword));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuItem> getItemById(@PathVariable Long id) {
        return menuService.getItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // @GetMapping("/items/{id}")
    // public boolean getItemActive(@PathVariable Long id){
    //     return menuService.get;
    // }

    // ── メニュー商品（書き込み）───────────────────────────

    @PostMapping("/items")
    public ResponseEntity<MenuItem> createItem(@RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuService.createItem(req));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<MenuItem> updateItem(@PathVariable Long id, @RequestBody MenuItemRequest req) {
        try {
            return ResponseEntity.ok(menuService.updateItem(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
