import { execSync } from "child_process";

type TvState = "Yes" | "No";

export async function onGetTvState() {
  // TODO handle offline (Error: Read/Write operation failed.)
  const tvStateBuffer = execSync(
    'shortcuts run "Get Viz monitors state" | tee'
  );

  const tvState = tvStateBuffer.toString() as TvState;

  if (tvState === "No") {
    return false;
  } else if (tvState === "Yes") {
    return true;
  }
  return null;
}

export async function onToggleTv() {
  const tvState = await onGetTvState();

  if (!tvState) {
    execSync('shortcuts run "Viz monitors on"');
  } else {
    execSync('shortcuts run "Viz monitors off"');
  }

  return await onGetTvState();
}
