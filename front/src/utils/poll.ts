export async function poll<T>(
    fn: () => Promise<T>,
    stop: (v: T) => boolean,
    { maxMs = 120_000, intervalMs = 1500 } = {}
): Promise<T> {
    const start = Date.now();
    while (true) {
        const v = await fn();
        if (stop(v)) return v;
        if (Date.now() - start > maxMs) throw new Error("Timeout while polling");
        await new Promise((r) => setTimeout(r, intervalMs));
    }
}
