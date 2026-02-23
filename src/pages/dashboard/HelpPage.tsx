import { useState } from "react";
import { HelpCircle, ChevronDown, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FAQs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How long does it take to set up?",
        a: "Just 2-3 minutes! Sign up, paste your website URL, and your bot is live. Our AI automatically learns everything about your business from your website."
      },
      {
        q: "Do I need any technical knowledge?",
        a: "Nope! BotLocal is designed for non-technical users. If you can paste a URL and click buttons, you can set up your AI assistant."
      },
      {
        q: "What languages does it support?",
        a: "BotLocal automatically detects and responds in: English, French, Italian, and Arabic. More languages coming soon!"
      }
    ]
  },
  {
    category: "Features",
    items: [
      {
        q: "Can it really handle bookings automatically?",
        a: "Yes! The bot collects customer details through conversation, confirms appointments, and stores everything in your dashboard. You can also send automatic confirmations via Telegram."
      },
      {
        q: "How does it know about my services?",
        a: "You paste your website URL during setup. Our AI reads everything on your site (services, prices, hours, FAQs) and uses that as its knowledge base."
      },
      {
        q: "Can customers reach me outside business hours?",
        a: "Yes! You can customize a message that goes out when you're closed, so customers know when you'll be available."
      },
      {
        q: "Does it integrate with my calendar?",
        a: "Currently it collects booking info and stores it in your dashboard. Full calendar sync is coming soon!"
      }
    ]
  },
  {
    category: "Billing",
    items: [
      {
        q: "Do you offer a free trial?",
        a: "Yes! You get 30 days free to try the Starter plan (500 messages/month). No credit card required."
      },
      {
        q: "What if I need more messages?",
        a: "Upgrade to Pro (5,000/month) or Agency (unlimited). You can change plans anytime with no penalties."
      },
      {
        q: "Can I cancel anytime?",
        a: "Absolutely. No long-term contracts. Cancel your subscription anytime from your billing page."
      }
    ]
  },
  {
    category: "Troubleshooting",
    items: [
      {
        q: "My website isn't scanning properly",
        a: "Make sure your website is public and accessible. If it has a login or paywalls, try scanning just a public page URL instead. Contact support if you need help."
      },
      {
        q: "The bot isn't responding correctly",
        a: "Make sure your knowledge base is updated. You can rescan your website if you've made changes to your services or hours."
      },
      {
        q: "How do I update my knowledge base?",
        a: "Go to Knowledge Base → Rescan. The bot will re-read your website and update what it knows about your business."
      },
      {
        q: "Is my customer data safe?",
        a: "Yes. All data is encrypted and securely stored. We never share your data with third parties."
      }
    ]
  }
];

export default function HelpPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions or get support</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for help..."
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Contact Support */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 flex items-start gap-4">
          <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get help from our team within 24 hours
            </p>
            <a href="mailto:support@botlocal.com" className="text-primary hover:underline text-sm font-medium">
              support@botlocal.com
            </a>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Chat with our support team in real-time
            </p>
            <Button variant="outline" size="sm">
              Start Chat
            </Button>
          </div>
        </Card>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" /> Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {FAQs.map((category, catIdx) => (
            <div key={catIdx}>
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )
                }
                className="w-full p-4 bg-muted rounded-lg flex items-center justify-between hover:bg-muted/80 transition-colors"
              >
                <h3 className="font-semibold text-foreground">{category.category}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${expandedCategory === category.category ? "rotate-180" : ""
                    }`}
                />
              </button>

              {expandedCategory === category.category && (
                <div className="space-y-2 mt-2 ml-2 border-l-2 border-primary/30 pl-4">
                  {category.items.map((faq, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => {
                          const faqId = `${category.category}-${idx}`;
                          setExpandedFaq(expandedFaq === faqId ? null : faqId);
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="font-medium text-foreground text-sm">{faq.q}</p>
                      </button>

                      {expandedFaq === `${category.category}-${idx}` && (
                        <div className="px-3 pb-3 text-sm text-muted-foreground">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Still need help? */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Our support team is here to help. We typically respond within 24 hours.
        </p>
        <div className="flex gap-3">
          <Button>Contact Support</Button>
          <Button variant="outline">View Documentation</Button>
        </div>
      </Card>

      {/* Quick Links */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: "Getting Started Guide", url: "#" },
            { title: "API Documentation", url: "#" },
            { title: "Security & Privacy", url: "#" },
            { title: "Terms of Service", url: "#" },
            { title: "Community Forum", url: "#" },
            { title: "Feature Roadmap", url: "#" }
          ].map((link, i) => (
            <a
              key={i}
              href={link.url}
              className="p-3 border border-input rounded-lg hover:bg-muted transition-colors text-sm text-foreground hover:text-primary"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
