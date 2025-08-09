import type { BackendService } from "./types";
import { BACKEND_PROVIDER } from "@/config";
import supabaseService from "./backend.supabase";
// Placeholder for future swap
// import flaskService from "./backend.flask";

let service: BackendService = supabaseService;

switch (BACKEND_PROVIDER) {
  case "supabase":
    service = supabaseService;
    break;
  case "flask":
    // service = flaskService; // to be implemented later
    service = supabaseService; // fallback to supabase
    break;
}

export default service;
