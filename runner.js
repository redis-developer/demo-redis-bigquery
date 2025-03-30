const run = async () => {
  log("dev:client", Bun.spawn(["bun", "run", "dev:client"]));
  log("dev:server", Bun.spawn(["bun", "run", "dev:server"]));

  process.on("SIGINT", async () => {
    console.log("Cleaning up...");
  });
};

async function log(name, proc) {
  for await (const chunk of proc.stdout) {
    console.log(`${name} >> ${new TextDecoder().decode(chunk)}`);
  }
}

run();
