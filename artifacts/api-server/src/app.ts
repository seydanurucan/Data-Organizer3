import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path"; // Bunu ekledik
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// BU KISMI EN ALTA EKLEDİK
// En alt kısmı şöyle yap:
// Bu kısım API dışındaki tüm istekleri (ana sayfa gibi) karşılar
if (process.env.NODE_ENV === "production") {
  const staticPath = path.resolve(__dirname, "../../codebuddy/dist");
  
  // Statik dosyaları (CSS, JS, resimler) sunar
  app.use(express.static(staticPath));
  
  // Ana sayfayı veya React sayfalarını index.html'e yönlendirir
  // Yıldız (*) yerine /* yazarak hatayı engelledik
  app.get("/*", (req, res) => {
    res.sendFile(path.resolve(staticPath, "index.html"), (err) => {
      if (err) {
        res.status(404).send(`Dosya bulunamadı! Şurada arıyorum: ${staticPath}`);
      }
    });
  });
}
}

export default app;
