import { MessageSquare, BookOpen, Mail } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>

      <div className="grid gap-4">
        {[
          { icon: BookOpen, title: "Documentation", desc: "Learn how to get the most out of BotLocal.", link: "#" },
          { icon: MessageSquare, title: "Live Chat", desc: "Chat with our support team in real time.", link: "#" },
          { icon: Mail, title: "Email Support", desc: "Send us an email at support@botlocal.com.", link: "#" },
        ].map((item, i) => (
          <a key={i} href={item.link} className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
