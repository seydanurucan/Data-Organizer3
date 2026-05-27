import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ExplainTermBody, DeepenExplanationBody, GetRoadmapBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/explain", async (req, res): Promise<void> => {
  const parsed = ExplainTermBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { term, language } = parsed.data;

  const systemPrompt = `Sen CodeBuddy adlı bir yapay zeka asistansın. Yazılım öğrenen öğrencilere kodlama terimlerini, kavramlarını ve syntax'larını çok basit, samimi ve eğlenceli bir Türkçe dille açıklıyorsun. Sanki yakın bir arkadaşın anlatıyormuş gibi. Açıklamanın ardından her zaman şu formatta bir kod örneği ver:

\`\`\`[dil]
// kod örneği buraya
\`\`\`

**Program Çıktısı:**
\`\`\`
çıktı buraya
\`\`\`

Türkçe kullan ama kod örnekleri İngilizce olabilir. Emojis kullanma.`;

  const userMessage = language
    ? `"${term}" kavramını ${language} programlama dilinde açıkla.`
    : `"${term}" kavramını açıkla.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/explain/deepen", async (req, res): Promise<void> => {
  const parsed = DeepenExplanationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { term, previousExplanation } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `Sen CodeBuddy. Konuyu daha derine in, daha fazla örnek ver, edge case'leri açıkla. Türkçe yaz, eğlenceli ol. Emojis kullanma.`,
      },
      {
        role: "user",
        content: `"${term}" hakkında daha önce şunu anlattın:\n\n${previousExplanation}\n\nŞimdi daha derinlemesine açıkla, bol örnekle.`,
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/explain/roadmap", async (req, res): Promise<void> => {
  const parsed = GetRoadmapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { term } = parsed.data;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `Sen CodeBuddy. Kullanıcıya bir konuyu pekiştirmeleri için 3 adımlık kısa öğrenim yol haritası ver. Her adım kısa bir başlık ve 1-2 cümle açıklama içermeli. JSON formatında yanıt ver. Emojis kullanma.`,
      },
      {
        role: "user",
        content: `"${term}" konusunu öğrendikten sonra ne yapmalıyım? 3 adımlık yol haritası ver. JSON formatı: {"term": "...", "steps": [{"order": 1, "title": "...", "description": "..."}, ...]}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(text);
  res.json(data);
});

export default router;
