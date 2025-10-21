import sys

def main():
    data = sys.stdin.read().strip().split()
    nums = [int(x) for x in data if 0 <= int(x) < 1000]
    if not nums:
        print(0)
    else:
        avg = sum(nums) / len(nums)
        print(round(avg))

if __name__ == "__main__":
    main()