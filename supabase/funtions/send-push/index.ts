import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { message, sender } = await req.json();

  await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Key os_v2_app_sgf3r2syhbhmrnflsxitaqkwpfendcvay7lucgfsngg6rvfzokjmpludqmjo2aef5jmu3yjkkfrdybbhex3h52x44eklebc47iuewza",
    },
    body: JSON.stringify({
      app_id: "918bb8ea-5838-4ec8-b4ab-95d130415679",
      included_segments: ["All"],
      headings: {
        en: `💜 New message from ${sender}`,
      },
      contents: {
        en: message,
      },
    }),
  });

  return new Response("ok");
});