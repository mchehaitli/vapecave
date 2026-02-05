import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  faqs: FAQ[];
}

export default function FAQPage() {
  const [openQuestions, setOpenQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(index)) {
      newOpenQuestions.delete(index);
    } else {
      newOpenQuestions.add(index);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const faqSections: FAQSection[] = [
    {
      title: "Part 1: The Law (SB 2024) & Legal Compliance",
      faqs: [
        {
          question: "What is the Texas Vape Ban (SB 2024)?",
          answer: "Senate Bill 2024, which took effect on September 1, 2025, is a Texas law that restricts the sale of specific e-cigarette products, primarily targeting foreign-made disposables, vapes appealing to minors, and all cannabinoid vapes."
        },
        {
          question: "What does SB 2024 primarily ban?",
          answer: "SB 2024 bans vapes manufactured in or with components from foreign adversaries (like China), products with packaging or shapes resembling toys or candy, and all vape products containing cannabinoids like THC or hemp-derived products."
        },
        {
          question: "What are the penalties for selling non-compliant vapes?",
          answer: "Sellers face a Class A misdemeanor, which can include fines up to $4,000 and up to one year in jail."
        },
        {
          question: "Is it illegal to possess a banned vape in Texas?",
          answer: "No. The penalties are for sellers. Personal possession is not penalized under this specific law."
        },
        {
          question: "What is the legal vaping age in Texas?",
          answer: "The minimum age to purchase any vape or nicotine product in Texas is 21."
        },
        {
          question: "What ID do I need to buy vapes?",
          answer: "You must present a valid, scannable government-issued ID for age verification at the time of purchase."
        },
        {
          question: "How do I verify a compliant vape?",
          answer: "Look for clear labeling that states 'U.S. Bottling' or 'U.S. E-Liquid,' a nicotine warning, a batch/lot code, and manufacturer information. Avoid products with cartoonish graphics."
        },
        {
          question: "Are THC or hemp-derived vapes (like Delta-8) legal?",
          answer: "No. SB 2024 includes cannabinoid-infused variants in its ban, which has led to a complete statewide ban on these vapes."
        }
      ]
    },
    {
      title: "Part 2: Legal Disposable Vapes",
      faqs: [
        {
          question: "Are all disposable vapes banned in Texas?",
          answer: "No. Disposable vapes are still legal and available in Texas if they are compliant. A compliant disposable must be assembled in the U.S. and be pre-filled with e-liquid that is bottled in the U.S."
        },
        {
          question: "What makes a disposable vape legal in Texas?",
          answer: "A compliant disposable must be assembled in the U.S. and, most importantly, be pre-filled with e-liquid that is bottled in the U.S."
        },
        {
          question: "Are brands like Geek Bar, RAZ, and Lost Mary illegal now?",
          answer: "The imported, foreign-made, pre-filled versions of these brands are restricted. However, compliant models from these brands are still legal to sell as long as they are U.S.-filled and properly labeled."
        },
        {
          question: "How can I spot a fake disposable?",
          answer: "Look for faded prints, missing holograms, rattly hardware, an unnatural taste, or a low puff count. Always scan serial numbers or QRs to verify."
        },
        {
          question: "What are some top-rated 50K+ puff compliant vapes?",
          answer: "Legal 50K puff models (which use U.S. e-liquids) include the Flum UT Bar 50K, Nexa Ultra 50K, MOTI NOVA 50K, and Rodman Playoffs 50K."
        },
        {
          question: "What are the best tobacco-flavored disposables?",
          answer: "Top-rated compliant tobacco disposables (using U.S. e-liquids) include the Keep It 100 Tobacco 18K, Juice Head Tobacco 20K, and Pachamama Tobacco 15K."
        },
        {
          question: "What are the modes on a Geek Bar Pulse X?",
          answer: "The Pulse X features dual modes, 'Standard' and 'Boost,' which allow you to switch between a regular draw and a harder, more intense draw."
        },
        {
          question: "What's the difference between the RAZ TN9000 and RAZ Edge?",
          answer: "The TN9000 is known for being compact with strong ice flavors, while the Edge series typically offers a higher puff count with stabilized coils."
        },
        {
          question: "How do I know when my disposable is empty?",
          answer: "The most common signs are a burnt, dry taste (even after charging), significantly diminished vapor production, or a flashing indicator light that won't go away."
        }
      ]
    },
    {
      title: "Part 3: Refillables, E-Liquids, & Tech",
      faqs: [
        {
          question: "Are refillable pod systems (like Caliburn) banned by SB 2024?",
          answer: "No. All refillable devices (pod systems, mods, pens) are unaffected by SB 2024 and are fully compliant."
        },
        {
          question: "What's a good, reliable pod system for Texas?",
          answer: "The Uwell Caliburn series (like the G3, A3, and G2) is highly recommended. They are fully refillable, unaffected by the ban, and work perfectly with U.S.-bottled e-liquids."
        },
        {
          question: "What are the best U.S.-made fruit-flavored e-liquids?",
          answer: "Top-rated fruit e-liquid brands include Juice Head (Guava Peach, Watermelon Lime) and Pachamama (Fuji Apple Strawberry Nectarine)."
        },
        {
          question: "What are the best U.S.-made dessert-flavored e-liquids?",
          answer: "Vapetasia is a classic choice, known for 'Killer Kustard' (silky vanilla) and 'Milk of the Poppy' (creamy cake)."
        },
        {
          question: "What are the best U.S.-made tobacco-flavored e-liquids?",
          answer: "Highly-rated U.S. tobacco juices include Monster Tobacco (Smooth Cavendish), Pod Juice Salt Nic Tobacco (Virginia leaf), and Twist Tobacco (Caramel classic)."
        },
        {
          question: "What are the best U.S-made candy-flavored e-liquids?",
          answer: "Candy King is a top brand for sweet flavors, with popular choices like 'Belt' (sour gummy) and 'Strawberry Watermelon Bubblegum'."
        },
        {
          question: "What's the difference between Freebase and Salt Nicotine?",
          answer: "Freebase (3-6mg) is traditional, ideal for high-wattage mods ('intensity'). Salt Nicotine (20-50mg) is smoother at high strengths, perfect for low-wattage pod systems ('smoothness')."
        },
        {
          question: "What do ohms (Ω) and wattage mean?",
          answer: "Ohms (Ω) is resistance. Higher ohms (e.g., 1.0 Ω) use low wattage (10-15W) for a smooth hit (ideal for salt nic). Watts (W) is power. Low ohms (e.g., 0.2–0.4 Ω) use high wattage (50W+) for an intense, high-vapor hit (ideal for freebase)."
        },
        {
          question: "What's a good, durable mod for the Texas climate?",
          answer: "The Geekvape Aegis series (like the Aegis Solo) is IP67-rated for ruggedness, making it a reliable performer that can handle Texas heat and daily carry."
        },
        {
          question: "Are some disposables 'refillable'?",
          answer: "Most disposables are not designed to be refilled. For refilling, it's safer and more cost-effective to use a dedicated pod system."
        }
      ]
    },
    {
      title: "Part 4: Health & Safety",
      faqs: [
        {
          question: "Can I get herpes from sharing a vape?",
          answer: "Yes, it is possible. While the risk from a single share is considered low, the herpes simplex virus (HSV-1) can be transmitted via saliva, making it a viable risk when sharing mouthpieces."
        },
        {
          question: "What other health risks come from sharing vapes?",
          answer: "Besides herpes, sharing vapes can easily transmit common viruses and bacteria, such as those that cause colds or the flu."
        },
        {
          question: "Should I vape at the gym?",
          answer: "It's generally not recommended. The cons (like dry mouth and dehydration) can outweigh the pros. Always follow venue policy and be discreet, preferably outdoors."
        },
        {
          question: "How many calories are in a vape hit?",
          answer: "Vape hits have a negligible amount of calories, averaging under 5. The PG/VG base is zero-calorie, with trace calories (0.5-2 per puff) coming from the sweeteners in the flavoring."
        }
      ]
    },
    {
      title: "Part 5: Purchasing & Alternatives",
      faqs: [
        {
          question: "Can I buy vapes on Amazon for delivery to Texas?",
          answer: "It's risky. Verifying a product's SB 2024 compliance is difficult on Amazon. You risk having your shipment blocked or receiving a non-compliant product. It's safer to buy from direct U.S. sources."
        },
        {
          question: "How does vape delivery or pickup work in Frisco, TX?",
          answer: "For local delivery and curbside pickup in Frisco, you must be 21+. You must present your valid, scannable ID at handoff, and all deliveries require an adult signature."
        },
        {
          question: "What items are eligible for delivery/pickup in Frisco?",
          answer: "Only Texas-compliant products: refillable devices, U.S.-bottled e-liquids, and U.S.-filled disposables."
        },
        {
          question: "Are nicotine pouches (ZYN, ALP) banned by SB 2024?",
          answer: "No. Tobacco-free nicotine pouches, such as ZYN, ALP, and VELO, are not classified as e-cigarette products and are not affected by SB 2024's regulations."
        },
        {
          question: "What are the best nicotine pouch flavors?",
          answer: "Based on popularity, top-ranked flavors include ZYN Wintergreen (6mg) and ZYN Cool Mint (3mg)."
        },
        {
          question: "What's the difference between ZYN, ALP, and VELO?",
          answer: "ALP is often cited as the flavor champ with bold 6mg options. ZYN is known for its slim, comfortable pouch. VELO is known for its quick-dissolving pouches."
        },
        {
          question: "Where is the safest place to buy compliant vapes?",
          answer: "From a verified, reputable local Texas retailer (like Vape Cave TX) that can certify their products' origins and ensure all disposables are U.S.-filled and compliant with SB 2024."
        }
      ]
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSections.flatMap(section =>
      section.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    )
  };

  let questionIndex = 0;

  return (
    <MainLayout
      title="38 Facts About Texas Vaping: SB 2024, Legal Vapes, & Rules | Vape Cave TX"
      description="Get 38 clear facts on Texas's SB 2024 vape ban, legal disposables, compliant brands (RAZ, Geek Bar), e-liquids, and purchasing rules."
      canonical="/faq"
      structuredData={faqSchema}
    >
      <div className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              The Ultimate Texas Vape FAQ
            </h1>
            <p className="text-xl text-muted-foreground">
              38 Facts You Need to Know About Vaping in Texas Post-SB 2024
            </p>
            <p className="text-muted-foreground mt-4">
              Here are answers to the most common questions Texas vapers have about Senate Bill 2024 and the current market, all in one place.
            </p>
          </div>

          {faqSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.faqs.map((faq) => {
                  const currentIndex = questionIndex++;
                  const isOpen = openQuestions.has(currentIndex);
                  
                  return (
                    <div
                      key={currentIndex}
                      className="rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary transition-all bg-card"
                      data-testid={`faq-item-${currentIndex}`}
                    >
                      <button
                        onClick={() => toggleQuestion(currentIndex)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 hover:bg-muted/30 transition-colors"
                        aria-expanded={isOpen}
                        data-testid={`faq-question-${currentIndex}`}
                      >
                        <span className="font-semibold text-lg pr-4 text-foreground">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div 
                          className="px-6 py-4 bg-card/50 border-t border-border"
                          data-testid={`faq-answer-${currentIndex}`}
                        >
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div 
            className="mt-12 p-6 rounded-lg bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
          >
            <h3 className="text-xl font-bold mb-3 text-primary">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              Visit us at one of our locations or contact us directly. Our knowledgeable staff is ready to help you find compliant, quality vape products.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/locations/frisco"
                className="inline-block px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                data-testid="link-frisco-location"
              >
                Frisco Location
              </a>
              <a
                href="/contact"
                className="inline-block px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors"
                data-testid="link-contact"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
