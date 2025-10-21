const { exec } = require("child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      setTimeout(checkPostgres, 100);
      return;
    }

    console.log("\n🟢 Postgres is accepting connections!\n");
  }
}

process.stdout.write("\n🔴 Waiting for postgres accept connections");

checkPostgres();
