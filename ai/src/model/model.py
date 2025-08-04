import torch
import torch.nn as nn

"""
 정리
- num_users, num_items: 전체 유저/아이템 개수
- user_feat_dim, item_feat_dim: 유저/아이템 특성 벡터 차원
- emb_dim: 임베딩 차원
- hidden_dims: MLP 은닉층 노드 수 리스트
- dropout: 드롭아웃 비율
"""
class FeatureDeepRec(nn.Module):
    def __init__(
        self,
        num_users: int,
        num_items: int,
        user_feat_dim: int,
        item_feat_dim: int,
        emb_dim: int = 64,
        hidden_dims: list[int] = [128, 64, 32],
        dropout: float = 0.2
    ):
        super().__init__()
        # ID 임베딩
        self.u_emb = nn.Embedding(num_users, emb_dim)
        self.i_emb = nn.Embedding(num_items, emb_dim)
        # 2) 특성 벡터를 임베딩 차원으로 투영
        self.u_feat_fc = nn.Linear(user_feat_dim, emb_dim)
        self.i_feat_fc = nn.Linear(item_feat_dim, emb_dim)

        # MLP 레이어 쌓기
        layers = []
        input_dim = emb_dim * 4  # u_emb + i_emb + u_feat + i_feat
        for h in hidden_dims:
            layers += [
                nn.Linear(input_dim, h),
                nn.BatchNorm1d(h),
                nn.LeakyReLU(),
                nn.Dropout(dropout),
            ]
            input_dim = h
        self.mlp = nn.Sequential(*layers)

        # 4) 최종 예측 레이어
        self.out = nn.Linear(input_dim, 1)
        self.act = nn.Sigmoid()

    def forward(self, users, items, user_feats, item_feats):
        # ID 임베딩
        u_e = self.u_emb(users)
        i_e = self.i_emb(items)
        # 특성 투영
        u_f = self.u_feat_fc(user_feats)
        i_f = self.i_feat_fc(item_feats)
        # 모두 concat → MLP → sigmoid
        x = torch.cat([u_e, i_e, u_f, i_f], dim=1)
        x = self.mlp(x)
        return self.act(self.out(x)).squeeze()
