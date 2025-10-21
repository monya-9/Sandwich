import sys

def main():
    data = sys.stdin.read().strip().split()
    n = int(data[0])
    arr = list(map(int, data[1:1+n]))
    dp = [1] * n
    for i in range(1, n):
        for j in range(i):
            if arr[j] < arr[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    print(max(dp))
if __name__ == "__main__":
    main()