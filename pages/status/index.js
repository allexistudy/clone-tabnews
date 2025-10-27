import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const data = await response.json();
  return data;
}

export default function Status() {
  return (
    <div>
      <UpdatedAt />
      <Database />
    </div>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAt = "Loading...";
  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <div>
      <h2>Status</h2> Updated at: {updatedAt}
    </div>
  );
}

function Database() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let database = "Loading...";
  if (!isLoading && data) {
    const { version, opened_connections, max_connections } =
      data.dependencies.database;
    database = (
      <>
        <div>Version: {version}</div>
        <div>Opened connections: {opened_connections}</div>
        <div>Max connections: {max_connections}</div>
      </>
    );
  }

  return (
    <div>
      <h2>Database</h2>
      {database}
    </div>
  );
}
