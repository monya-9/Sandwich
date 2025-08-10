import torch
import torch.nn as nn

class FeatureDeepRec(nn.Module):
    def __init__(
        self,
        num_users: int,
        num_items: int,
        user_feat_dim: int,
        item_feat_dim: int,
        emb_dim: int = 64,
        hidden_dims: list[int] = [128, 64, 32],
        dropout: float = 0.2,
    ):
        super().__init__()
        self.u_emb = nn.Embedding(num_users, emb_dim)
        self.i_emb = nn.Embedding(num_items, emb_dim)
        self.u_feat_fc = nn.Linear(user_feat_dim, emb_dim)
        self.i_feat_fc = nn.Linear(item_feat_dim, emb_dim)

        layers, d = [], emb_dim * 4
        for h in hidden_dims:
            layers += [nn.Linear(d, h), nn.BatchNorm1d(h), nn.LeakyReLU(), nn.Dropout(dropout)]
            d = h
        self.mlp = nn.Sequential(*layers)
        self.out = nn.Linear(d, 1)
        self.act = nn.Sigmoid()

    def forward(self, users, items, user_feats, item_feats):
        u_e = self.u_emb(users)
        i_e = self.i_emb(items)
        u_f = self.u_feat_fc(user_feats)
        i_f = self.i_feat_fc(item_feats)
        x = torch.cat([u_e, i_e, u_f, i_f], dim=1)
        x = self.mlp(x)
        return self.act(self.out(x)).squeeze()
