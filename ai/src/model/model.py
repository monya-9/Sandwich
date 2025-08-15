import torch
import torch.nn as nn
import torch.nn.functional as F

class FeatureDeepRec(nn.Module):
    def __init__(
        self,
        num_users: int,
        num_items: int,
        user_feat_dim: int,
        item_feat_dim: int,
        embed_dim: int = 64,
        mlp_dims=(128, 64),
        dropout=0.2,
    ):
        super().__init__()
        self.user_id_emb = nn.Embedding(num_users, embed_dim)
        self.item_id_emb = nn.Embedding(num_items, embed_dim)

        self.user_feat_fc = nn.Sequential(
            nn.Linear(user_feat_dim, 256), nn.LeakyReLU(),
            nn.BatchNorm1d(256), nn.Dropout(dropout),
            nn.Linear(256, embed_dim)
        )
        self.item_feat_fc = nn.Sequential(
            nn.Linear(item_feat_dim, 256), nn.LeakyReLU(),
            nn.BatchNorm1d(256), nn.Dropout(dropout),
            nn.Linear(256, embed_dim)
        )

        layers = []
        in_dim = embed_dim * 4
        for d in mlp_dims:
            layers += [nn.Linear(in_dim, d), nn.LeakyReLU(), nn.BatchNorm1d(d), nn.Dropout(dropout)]
            in_dim = d
        layers += [nn.Linear(in_dim, 1)]
        self.mlp = nn.Sequential(*layers)

    def encode_user_feats(self, u_feat: torch.Tensor) -> torch.Tensor:
        z = self.user_feat_fc(u_feat)
        # eps 지정해 0벡터 정규화 시 NaN 방지
        return F.normalize(z, dim=1, eps=1e-8)

    def encode_item_feats(self, i_feat: torch.Tensor) -> torch.Tensor:
        z = self.item_feat_fc(i_feat)
        return F.normalize(z, dim=1, eps=1e-8)

    def forward(self, u_ids: torch.Tensor, i_ids: torch.Tensor,
                u_feat: torch.Tensor, i_feat: torch.Tensor) -> torch.Tensor:
        u_id_emb = self.user_id_emb(u_ids)
        i_id_emb = self.item_id_emb(i_ids)
        u_feat_emb = self.user_feat_fc(u_feat)
        i_feat_emb = self.item_feat_fc(i_feat)
        x = torch.cat([u_id_emb, i_id_emb, u_feat_emb, i_feat_emb], dim=1)
        out = self.mlp(x)
        return torch.sigmoid(out).squeeze(1)
