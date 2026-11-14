// Settings from the environment. The tool was called amber before Pinto Notes; every AMBER_ name
// still works when the PINTO_ one isn't set.

/** PINTO_<name>, else AMBER_<name>. */
export const env = (name: string): string | undefined => Deno.env.get(`PINTO_${name}`) ?? Deno.env.get(`AMBER_${name}`);

/** Which of the two is set, for messages ("The server refused PINTO_TOKEN."). */
export const envName = (name: string): string => Deno.env.get(`PINTO_${name}`) !== undefined ? `PINTO_${name}` : Deno.env.get(`AMBER_${name}`) !== undefined ? `AMBER_${name}` : `PINTO_${name}`;
