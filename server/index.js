import "dotenv/config";
import app, { initialize } from "./app.js";

const port = process.env.PORT ?? 3000;

app.listen(process.env.PORT ?? 3000, async () => {
  console.log(`Server listening on port ${port}`);

  await initialize();
});
