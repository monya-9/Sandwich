def main():
    import sys
    
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx]); idx += 1
    m = int(data[idx]); idx += 1
    
    baskets = []
    for _ in range(m):
        k = int(data[idx]); idx += 1
        basket = 0
        for __ in range(k):
            fruit = int(data[idx]); idx += 1
            basket |= (1 << fruit)
        baskets.append(basket)
    
    def dfs(mask, i):
        if i == m:
            return 1
        
        # 현재 바구니를 선택하지 않는 경우
        count = dfs(mask, i + 1)
        
        # 현재 바구니를 선택할 수 있는 경우
        if (mask & baskets[i]) == 0:
            count += dfs(mask | baskets[i], i + 1)
        
        return count
    
    result = dfs(0, 0) - 1  # 아무 바구니도 선택하지 않는 경우 제외
    print(result)

if __name__ == "__main__":
    main()