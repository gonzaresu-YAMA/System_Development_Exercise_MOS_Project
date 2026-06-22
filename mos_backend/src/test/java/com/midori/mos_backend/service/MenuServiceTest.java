package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MenuServiceTest {

    @Autowired
    private MenuService menuService;

    @Test
    @DisplayName("全カテゴリを sort_order 順に取得できる")
    void getAllCategories_returnsSortedList() {
        List<Category> categories = menuService.getAllCategories();

        assertThat(categories).isNotEmpty();
        assertThat(categories.get(0).getSortOrder())
                .isLessThanOrEqualTo(categories.get(categories.size() - 1).getSortOrder());
    }

    @Test
    @DisplayName("カテゴリ名でメニュー商品を取得できる")
    void getItemsByCategory_returnsFilteredItems() {
        List<MenuItem> items = menuService.getItemsByCategory("yakitori");

        assertThat(items).isNotEmpty();
        assertThat(items).allMatch(item -> item.getCategory().getName().equals("yakitori"));
    }

    @Test
    @DisplayName("売り切れ商品は getAllAvailableItems に含まれない")
    void getAllAvailableItems_excludesSoldOut() {
        List<MenuItem> items = menuService.getAllAvailableItems();

        assertThat(items).allMatch(item -> !item.isSoldOut());
    }

    @Test
    @DisplayName("IDでメニュー商品を取得できる")
    void getItemById_returnsItem() {
        Optional<MenuItem> item = menuService.getItemById(1L);

        assertThat(item).isPresent();
        assertThat(item.get().getName()).isEqualTo("ねぎま");
    }

    @Test
    @DisplayName("存在しないIDは空を返す")
    void getItemById_notFound_returnsEmpty() {
        Optional<MenuItem> item = menuService.getItemById(9999L);

        assertThat(item).isEmpty();
    }

    @Test
    @DisplayName("キーワード検索でヒットする商品を返す")
    void searchItems_matchingKeyword() {
        List<MenuItem> items = menuService.searchItems("ビール");

        assertThat(items).isNotEmpty();
        assertThat(items).allMatch(item -> item.getName().contains("ビール"));
    }

    @Test
    @DisplayName("キーワード検索でヒットしない場合は空リストを返す")
    void searchItems_noMatch_returnsEmpty() {
        List<MenuItem> items = menuService.searchItems("存在しない商品名XYZ");

        assertThat(items).isEmpty();
    }

    @Test
    @DisplayName("価格範囲でメニュー商品を取得できる")
    void getItemsByPriceRange_returnsInRange() {
        List<MenuItem> items = menuService.getItemsByPriceRange(160, 200);

        assertThat(items).isNotEmpty();
        assertThat(items).allMatch(item -> item.getPrice() >= 160 && item.getPrice() <= 200);
    }
}
