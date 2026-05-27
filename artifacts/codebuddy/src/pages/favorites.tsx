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
        toast({ title: "Favoriden kaldirildi" });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1">KAYITLI</p>
        <h1 className="text-2xl font-bold text-gradient font-mono">Favoriler</h1>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!favorites || favorites.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <Star className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-mono text-sm">Henuz favori eklemediniz.</p>
          <button onClick={() => setLocation("/")} className="text-primary text-sm hover:underline font-mono">
            Bir terim arayip yildiz ikonuna basin
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {favorites?.map((fav: any) => (
          <div key={fav.id} className="glass-card rounded-xl p-4 flex items-start gap-3 group" data-testid={`card-favorite-${fav.id}`}>
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono font-semibold text-white text-sm truncate">{fav.term}</p>
                {fav.language && <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-mono">{fav.language}</span>}
              </div>
              {fav.explanation && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fav.explanation}</p>}
              <p className="text-xs text-muted-foreground/50 mt-1 font-mono">{new Date(fav.createdAt).toLocaleDateString("tr-TR")}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setLocation(`/explain/${encodeURIComponent(fav.term)}`)} className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95" data-testid={`btn-view-fav-${fav.id}`}>
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => handleRemove(fav.id)} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors active:scale-95" data-testid={`btn-delete-fav-${fav.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
