import torch
import torch.nn as nn

class NeuMF(nn.Module):
    def __init__(self, num_users, num_items, mf_dim=8, mlp_layers=[16,8]):
        super().__init__()
        self.user_gmf = nn.Embedding(num_users, mf_dim)
        self.item_gmf = nn.Embedding(num_items, mf_dim)
        self.user_mlp = nn.Embedding(num_users, mlp_layers[0]//2)
        self.item_mlp = nn.Embedding(num_items, mlp_layers[0]//2)

        mlp = []
        inp = mlp_layers[0]
        for sz in mlp_layers[1:]:
            mlp += [nn.Dropout(0.2), nn.Linear(inp, sz), nn.ReLU()]
            inp = sz
        self.mlp = nn.Sequential(*mlp)

        self.out = nn.Linear(mf_dim + mlp_layers[-1], 1)
        self.sig = nn.Sigmoid()

    def forward(self, u, i):
        gmf = self.user_gmf(u) * self.item_gmf(i)
        mlp_in = torch.cat([self.user_mlp(u), self.item_mlp(i)], dim=1)
        mlp = self.mlp(mlp_in)
        x = torch.cat([gmf, mlp], dim=1)
        return self.sig(self.out(x)).squeeze()
