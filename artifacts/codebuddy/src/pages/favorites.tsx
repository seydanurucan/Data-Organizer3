import { useLocation } from "wouter";
import { Star, Trash2, Search } from "lucide-react";
import { useListFavorites, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: favorites, isLoading } = useListFavorites({
    query: { queryKey: getListFavoritesQueryKey(), enabled: !!token },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  const removeMutation = useRemoveFavorite();

  const handleRemove = (id: number) => {
    removeMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        toast({ title: "Favoriden kaldırıldı" });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">

      <div>
        <p className="text-xs font-mono tracking-widest mb-1" style={{ color: 'rgba(0,255,65,0.45)' }}>KAYDEDİLENLER</p>
        <h1 className="text-2xl font-bold font-mono text-gradient-green">Favorilerim</h1>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'rgba(0,255,65,0.04)' }} />
          ))}
        </div>
      )}

      {!isLoading && (!favorites || favorites.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}>
            <Star className="w-7 h-7" style={{ color: 'rgba(0,255,65,0.25)' }} />
          </div>
          <div>
            <p className="font-mono text-sm font-semibold mb-1" style={{ color: 'rgba(200,220,205,0.6)' }}>Henüz favori eklemediniz.</p>
            <p className="text-xs font-mono" style={{ color: 'rgba(140,170,148,0.4)' }}>Bir kavram açıkladıktan sonra yıldız simgesine basın.</p>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 rounded-xl font-mono text-xs btn-press"
            style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', color: '#00ff41' }}
          >
            Kavram Ara
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {favorites?.map((fav: any) => (
          <div
            key={fav.id}
            className="rounded-2xl p-4 flex items-start gap-3 group"
            style={{ background: 'rgba(8,14,10,0.8)', border: '1px solid rgba(0,255,65,0.08)', backdropFilter: 'blur(12px)' }}
            data-testid={`card-favorite-${fav.id}`}
          >
            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(250,200,0,0.1)', border: '1px solid rgba(250,200,0,0.2)' }}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono font-bold text-sm truncate" style={{ color: 'rgba(220,240,225,0.9)' }}>{fav.term}</p>
                {fav.language && (
                  <span className="tag-pill">{fav.language}</span>
                )}
              </div>
              {fav.explanation && (
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'rgba(140,170,148,0.55)' }}>{fav.explanation}</p>
              )}
              <p className="text-xs font-mono mt-1.5" style={{ color: 'rgba(100,130,108,0.4)' }}>
                {new Date(fav.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setLocation(`/explain/${encodeURIComponent(fav.term)}`)}
                className="p-2 rounded-lg btn-press"
                style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.15)', color: 'rgba(0,255,65,0.7)' }}
                data-testid={`btn-view-fav-${fav.id}`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRemove(fav.id)}
                className="p-2 rounded-lg btn-press"
                style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.15)', color: 'rgba(255,100,100,0.7)' }}
                data-testid={`btn-delete-fav-${fav.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
