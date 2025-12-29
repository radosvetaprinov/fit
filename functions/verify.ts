export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const token = formData.get("cf-turnstile-response");

    if (!token) {
      return new Response("Token manquant", { status: 400 });
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      console.error("TURNSTILE_SECRET_KEY non configurée");
      return new Response("Configuration serveur incorrecte", { status: 500 });
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token
        })
      }
    );

    const result = await response.json();
    
    console.log("Turnstile result:", result);

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: "Vérification refusée",
        details: result["error-codes"]
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("Erreur:", error);
    return new Response("Erreur serveur", { status: 500 });
  }
}