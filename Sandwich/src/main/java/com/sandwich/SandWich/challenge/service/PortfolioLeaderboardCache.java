package com.sandwich.SandWich.challenge.service;


import com.sandwich.SandWich.challenge.dto.LeaderboardDtos;
import com.sandwich.SandWich.challenge.repository.PortfolioVoteRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioLeaderboardCache {

    private final RedisTemplate<String, Object> redis;
    private final PortfolioVoteRepository voteRepo;

    private static int toInt(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s) {
            // "5" 혹은 "5.0" 형태도 허용
            return (int) Math.round(Double.parseDouble(s));
        }
        if (o instanceof Boolean b) return b ? 1 : 0;
        throw new IllegalArgumentException("Unsupported number type: " + o.getClass());
    }

    @SuppressWarnings("unchecked")
    private static java.util.List<Integer> toIntList(Object o) {
        if (o == null) return java.util.List.of(0,0,0,0);
        if (o instanceof java.util.List<?> l) {
            var out = new java.util.ArrayList<Integer>(l.size());
            for (var e : l) out.add(toInt(e));
            return out;
        }
        // 만약 문자열로 저장된 JSON이라면 여기 오기 전에 캐시를 지워 재빌드하게 하는 것이 더 안전
        throw new IllegalArgumentException("sum is not a list: " + o.getClass());
    }

    public PortfolioLeaderboardCache(
            @org.springframework.beans.factory.annotation.Qualifier("redisJsonTemplate")
            org.springframework.data.redis.core.RedisTemplate<String, Object> redis,
            PortfolioVoteRepository voteRepo
    ) {
        this.redis = redis;
        this.voteRepo = voteRepo;
    }

    private String keyStats(long chId) { return "challenge:%d:lb:stats".formatted(chId); }
    private String keySubs(long chId)  { return "challenge:%d:lb:subs".formatted(chId); }

    // 증분 적용: 점수 합/개수 증감
    @Transactional
    public void applyDelta(long chId, long subId, int dUi, int dCr, int dCq, int dDf, int dCnt) {
        var h = redis.opsForHash();
        var f = Long.toString(subId);

        @SuppressWarnings("unchecked")
        var cur = (java.util.Map<String, Object>) h.get(keyStats(chId), f);

        int[] sum = {0,0,0,0};
        int cnt = 0;

        if (cur != null) {
            var sList = toIntList(cur.get("sum"));
            // 4개 보장 아니면 채움
            while (sList.size() < 4) sList.add(0);
            sum[0] = sList.get(0); sum[1] = sList.get(1);
            sum[2] = sList.get(2); sum[3] = sList.get(3);
            cnt = toInt(cur.get("cnt"));
        }

        sum[0]+=dUi; sum[1]+=dCr; sum[2]+=dCq; sum[3]+=dDf; cnt+=dCnt;

        if (cnt <= 0) {
            h.delete(keyStats(chId), f);
            redis.opsForSet().remove(keySubs(chId), f);
            return;
        }

        var val = java.util.Map.of(
                "sum", java.util.List.of(sum[0], sum[1], sum[2], sum[3]),
                "cnt", cnt,
                "v", 1 // ← (선택) 버전 필드로 포맷 구분
        );
        h.put(keyStats(chId), f, val);
        redis.opsForSet().add(keySubs(chId), f);
    }

    // 전체 재빌드 (캐시 미스 시)
    @Transactional(readOnly = true)
    public void rebuild(long chId) {
        var statsKey = keyStats(chId);
        var subsKey  = keySubs(chId);
        redis.delete(java.util.List.of(statsKey, subsKey));
        var agg = voteRepo.aggregateBySubmission(chId);
        if (agg.isEmpty()) return;
        var h = redis.opsForHash();
        var s = redis.opsForSet();
        for (var a : agg) {
            var val = java.util.Map.of(
                    "sum", java.util.List.of(
                            a.getSumUiUx().intValue(), a.getSumCreativity().intValue(),
                            a.getSumCodeQuality().intValue(), a.getSumDifficulty().intValue()
                    ),
                    "cnt", a.getCnt().intValue()
            );
            h.put(statsKey, Long.toString(a.getSubmissionId()), val);
            s.add(subsKey, Long.toString(a.getSubmissionId()));
        }
    }

    // 조회: 해시 전체 읽어서 정렬/랭크
    @Transactional(readOnly = true)
    public LeaderboardDtos.Resp get(long chId, int limit) {
        var statsKey = keyStats(chId);
        var subsKey  = keySubs(chId);

        var subIds = redis.opsForSet().members(subsKey);
        boolean cacheHit = subIds != null && !subIds.isEmpty();

        if (!cacheHit) {
            rebuild(chId);
            subIds = redis.opsForSet().members(subsKey);
            cacheHit = subIds != null && !subIds.isEmpty();
        }
        var items = new java.util.ArrayList<LeaderboardDtos.Item>();
        if (subIds != null) {
            for (var sid : subIds) {
                @SuppressWarnings("unchecked")
                var m = (java.util.Map<String, Object>) redis.opsForHash().get(statsKey, sid.toString());
                if (m == null) continue;

                var sum = toIntList(m.get("sum"));
                while (sum.size() < 4) sum.add(0);
                int cnt = toInt(m.get("cnt"));
                if (cnt <= 0) continue;

                double a1 = sum.get(0) / (double) cnt;
                double a2 = sum.get(1) / (double) cnt;
                double a3 = sum.get(2) / (double) cnt;
                double a4 = sum.get(3) / (double) cnt;
                double total = (a1 + a2 + a3 + a4) / 4.0;
                items.add(LeaderboardDtos.Item.builder()
                        .submissionId(Long.valueOf(sid.toString()))
                        .voteCount(cnt)
                        .uiUxAvg(a1).creativityAvg(a2).codeQualityAvg(a3).difficultyAvg(a4)
                        .totalScore(total).build());
            }
        }
        items.sort(java.util.Comparator.comparingDouble(LeaderboardDtos.Item::totalScore).reversed());
        int r=1;
        for (var i : items) {
            // set rank via builder copy
        }
        var ranked = new java.util.ArrayList<LeaderboardDtos.Item>();
        for (var it : items) {
            ranked.add(LeaderboardDtos.Item.builder()
                    .submissionId(it.submissionId())
                    .voteCount(it.voteCount())
                    .uiUxAvg(it.uiUxAvg())
                    .creativityAvg(it.creativityAvg())
                    .codeQualityAvg(it.codeQualityAvg())
                    .difficultyAvg(it.difficultyAvg())
                    .totalScore(it.totalScore())
                    .rank(r++).build());
            if (limit>0 && ranked.size()>=limit) break;
        }
        return LeaderboardDtos.Resp.builder()
                .items(ranked)
                .cacheHit(cacheHit)
                .generatedAt(System.currentTimeMillis())
                .build();
    }
}
