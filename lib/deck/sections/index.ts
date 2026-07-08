// Side-effect imports: each file registers itself with the section registry.
import "./hero";
import "./agenda";
import "./slide";
import "./cards";
import "./image";
import "./gallery";
import "./chart";
import "./timeline";
import "./comparison";
import "./faq";
import "./quote";
import "./cta";

// Re-export the registry functions for consumers.
export {
  registerSection,
  getSection,
  getAllSections,
  getAddableSections,
} from "@/lib/deck/sectionRegistry";
