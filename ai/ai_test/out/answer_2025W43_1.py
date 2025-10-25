import sys

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    s = int(data[1])
    arr = list(map(int, data[2:2+n]))
    
    min_length = float('inf')
    current_sum = 0
    left = 0
    
    for right in range(n):
        current_sum += arr[right]
        
        while current_sum >= s:
            min_length = min(min_length, right - left + 1)
            current_sum -= arr[left]
            left += 1
    
    if min_length == float('inf'):
        print(0)
    else:
        print(min_length)

if __name__ == "__main__":
    main()