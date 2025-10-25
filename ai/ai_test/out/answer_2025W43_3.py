import sys

def main():
    data = sys.stdin.read().split()
    n, k = int(data[0]), int(data[1])
    arr = list(map(int, data[2:2+n]))
    
    count = 0
    prefix_sum = 0
    sum_count = {0: 1}
    
    for num in arr:
        prefix_sum += num
        if prefix_sum - k in sum_count:
            count += sum_count[prefix_sum - k]
        sum_count[prefix_sum] = sum_count.get(prefix_sum, 0) + 1
    
    print(count)

if __name__ == "__main__":
    main()