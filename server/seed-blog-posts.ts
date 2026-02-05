import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

dotenv.config();

// Initialize Postgres and Drizzle
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

/**
 * Seed script to populate the database with new blog posts
 */
async function seedBlogPosts() {
  console.log('Starting blog post seeding...');

  try {
    // First delete all existing blog posts
    await db.delete(schema.blogPosts).execute();
    console.log('Deleted existing blog posts');
    
    // Define the new blog posts
    const blogPosts = [
      {
        title: 'Vaping vs. Smoking: Understanding the Core Differences for a Healthier Choice',
        slug: 'vaping-vs-smoking-understanding-core-differences',
        summary: 'The debate between vaping and traditional smoking has become a central topic for those looking to make informed decisions about nicotine consumption.',
        content: `The debate between vaping and traditional smoking has become a central topic for those looking to make informed decisions about nicotine consumption. While both involve inhaling a substance, the fundamental processes and the resulting effects on the body are quite different. Understanding these key distinctions is crucial for anyone considering switching from smoking or exploring vaping for the first time.

At its core, the primary difference lies in the method of delivery. Traditional cigarettes rely on the combustion, or burning, of tobacco. This high-temperature process creates smoke filled with thousands of chemicals, many of which are harmful and known to cause cancer. When you light a cigarette, you're inhaling this complex mixture directly into your lungs.

Vaping, on the other hand, involves heating a liquid, often called e-liquid or vape juice, to create an aerosol. This e-liquid typically contains nicotine (though nicotine-free options exist), flavorings, and carrier substances. The heating process in a vape device occurs at a much lower temperature than the burning of tobacco, and importantly, it does not produce the same harmful byproducts found in cigarette smoke like tar and carbon monoxide.

The chemical composition of what's inhaled also varies significantly. Cigarette smoke is a complex cocktail of over 7,000 chemicals, including numerous carcinogens. Vape aerosol, while not entirely harmless, generally contains a significantly lower number of chemicals. However, it can still contain substances like nicotine, heavy metals, and flavorings, some of which may pose health risks.

In terms of health effects, smoking has well-established and severe consequences, being a leading cause of various cancers, heart disease, and lung problems. Vaping is often perceived as less harmful, and while it eliminates many of the most dangerous components of cigarette smoke, it is not risk-free. Research into the long-term health effects of vaping is still ongoing.

Finally, both smoking and vaping deliver nicotine, which is a highly addictive substance. The concentration of nicotine can vary in both products, and it's important to be aware of the potential for dependence with either method.

By understanding these fundamental differences in how they work, what they contain, and their potential health implications, individuals can make more informed choices about their nicotine consumption habits.`,
        is_featured: true,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'Vaping vs. Smoking: Understanding Key Differences',
        meta_description: 'Learn about the fundamental differences between vaping and smoking to make more informed choices about nicotine consumption.',
      },
      {
        title: 'Vaping vs. Smoking: Evaluating the Evidence on Harm Reduction',
        slug: 'vaping-vs-smoking-evaluating-evidence-harm-reduction',
        summary: 'Is vaping really safer than smoking? Explore the evidence and nuanced considerations in this detailed comparison.',
        content: `The question of whether vaping is safer than smoking is frequently asked, and the answer is nuanced. While vaping is generally considered less harmful than smoking, it's essential to understand the reasons behind this and the limitations of current knowledge.

One of the main reasons vaping is often seen as a less harmful alternative is the absence of combustion. Burning tobacco in cigarettes produces a vast array of toxic chemicals, including tar and carbon monoxide, which are major contributors to smoking-related diseases. Vaping eliminates this burning process, thus significantly reducing exposure to these particular harmful substances.

Studies have shown that the levels of many harmful chemicals are considerably lower in vape aerosol compared to cigarette smoke. This reduction in toxicants is a key factor in the argument for vaping as a harm reduction tool, particularly for adult smokers who are unable or unwilling to quit smoking completely.

However, it's crucial to acknowledge that vaping is not entirely safe. Vape aerosol can still contain potentially harmful substances, such as heavy metals, ultrafine particles, and certain flavorings. The long-term effects of inhaling these substances are still being studied, and more research is needed to fully understand the potential risks associated with prolonged vaping.

Furthermore, the presence of nicotine in most vape products means that it carries the risk of addiction, similar to traditional cigarettes. Nicotine itself has various effects on the body, including raising blood pressure and heart rate.

It's also important to consider the context. For non-smokers, especially young people, starting to vape is not a safer alternative to not using any nicotine products at all. Vaping still poses risks, and its appeal to younger demographics is a significant public health concern.

In conclusion, while the current evidence suggests that vaping is less harmful than smoking for adult smokers who switch completely, it is not a risk-free activity. The best way to protect your health is to avoid both smoking and vaping altogether.`,
        is_featured: false,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1535325019257-3f8a7f13dabb?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'Is Vaping Safer Than Smoking? Evidence on Harm Reduction',
        meta_description: 'Examine the evidence on whether vaping is truly safer than smoking and understand the nuanced health considerations.',
      },
      {
        title: 'Unlocking the Potential of CBD: A Beginner\'s Guide to Cannabidiol',
        slug: 'unlocking-potential-cbd-beginners-guide',
        summary: 'Explore the basics of CBD, its potential benefits, and various consumption methods in this comprehensive guide.',
        content: `Cannabidiol, or CBD, has become a popular topic in the wellness world, with many people exploring its potential benefits and uses. Unlike THC, the well-known compound in cannabis, CBD is not psychoactive, meaning it won't make you feel "high." This distinction makes it an appealing option for those seeking the therapeutic properties of cannabis without the intoxicating effects.

CBD is one of many cannabinoids found in the cannabis plant. It interacts with the body's endocannabinoid system, a complex network that plays a role in regulating various functions like mood, sleep, pain, and immune response.

One of the most well-researched and recognized benefits of CBD is its potential to help manage certain types of seizures. In fact, there is an FDA-approved medication containing CBD for specific severe forms of epilepsy.

Beyond epilepsy, research suggests that CBD may have other therapeutic properties. Many users report that CBD helps with anxiety, promoting a sense of calm and relaxation. It's also being studied for its potential to alleviate chronic pain and inflammation. Some studies indicate that CBD might help improve sleep quality and reduce symptoms of depression. However, it's important to note that research in these areas is still ongoing, and more studies are needed to confirm these benefits.

CBD is available in various forms, including oils, edibles (like gummies), topicals (creams and lotions), and even vape products. The method of consumption can affect how quickly and effectively the CBD is absorbed by the body. For example, vaping CBD allows for faster absorption through the lungs, while edibles take longer to have an effect as they need to be digested.

When considering CBD, it's essential to be aware of potential side effects, which are generally mild but can include dry mouth, drowsiness, and changes in appetite. It's also crucial to talk to your doctor before using CBD, especially if you are taking other medications, as CBD can interact with certain drugs.

Understanding what CBD is, its potential benefits, and how it's used can help you make informed decisions about whether it might be right for you.`,
        is_featured: true,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1591462391971-dd6a02d18717?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'CBD Beginners Guide: Understanding Benefits and Uses',
        meta_description: 'Learn everything you need to know about CBD, from its potential benefits to various product types and consumption methods.',
      },
      {
        title: 'Your Guide to CBD: Understanding Safety, Legal Status, and Different Products',
        slug: 'guide-cbd-safety-legal-status-products',
        summary: 'Navigate the complex world of CBD with information on safety considerations, legal status, and the various product types available.',
        content: `As the popularity of CBD continues to grow, it's important to navigate the landscape with a clear understanding of its safety profile, legal status, and the different types of products available.

In terms of safety, CBD is generally considered well-tolerated by most people. However, like any substance, it can have potential side effects. These can include dry mouth, fatigue, drowsiness, and changes in appetite or digestion. It's crucial to start with a low dose and monitor how your body reacts. A significant safety consideration is the potential for CBD to interact with other medications. CBD can affect liver enzymes that metabolize certain drugs, so it's vital to consult with your healthcare provider before using CBD if you are taking any prescription or over-the-counter medications.

The legal status of CBD in the United States can be somewhat complex. At the federal level, CBD derived from hemp (containing less than 0.3% THC) is legal. However, state laws can vary, with some states having more restrictive regulations. It's essential to be aware of the laws in your specific location regarding the sale and use of CBD products.

The market offers a wide variety of CBD product types, each with its own characteristics and methods of use. CBD oils and tinctures are popular and can be taken sublingually (under the tongue) for relatively fast absorption. CBD edibles, such as gummies and chocolates, provide a convenient and often tasty way to consume CBD, although the effects may take longer to appear. CBD topicals, like creams and balms, are applied directly to the skin and are often used for localized relief of pain or inflammation. CBD can also be vaped using specialized vape devices and e-liquids, which allows for rapid absorption.

When purchasing CBD products, it's advisable to choose reputable brands that provide third-party lab testing to verify the CBD content and ensure the absence of harmful contaminants. This transparency helps consumers make informed choices and ensures they are getting a quality product.

By staying informed about the safety considerations, legal landscape, and the variety of CBD products available, you can confidently explore whether CBD might be a beneficial addition to your wellness routine.`,
        is_featured: false,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1616689355221-a5a9f9561805?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'CBD Safety, Legal Status, and Product Guide',
        meta_description: 'Important information about CBD safety considerations, current legal status, and a comprehensive guide to different product types.',
      },
      {
        title: 'Vaping in 2025: Exploring the Cutting Edge of Vape Technology',
        slug: 'vaping-2025-cutting-edge-technology',
        summary: 'Discover the innovative trends and technological advancements shaping the future of vaping devices and experiences.',
        content: `The vaping industry is constantly evolving, with new technologies and innovations emerging each year. As we look towards 2025, several key trends are set to shape the future of vaping devices and experiences.

One significant trend is the rise of smart vape devices. These advanced devices are incorporating features like Bluetooth connectivity and integration with smartphone apps. This allows users to monitor their vaping habits, adjust temperature settings for a customized experience, and even access information about their device and e-liquids. Some smart vapes are also featuring enhanced safety features and personalized recommendations.

Battery technology continues to advance, and in 2025, we can expect to see further improvements in battery life and charging capabilities for vape devices. Longer-lasting batteries and faster charging times will enhance the convenience and usability of vapes, ensuring users can enjoy their devices throughout the day without frequent interruptions. Wireless charging is also becoming more prevalent.

Innovations in heating technology are also refining the vaping experience. New heating elements, such as ceramic coils and mesh designs, are gaining popularity for their ability to provide a purer flavor and more consistent vapor production. These advancements aim to improve the overall quality and satisfaction of vaping. Graphene coil technology is also on the horizon, promising even faster and more even heating.

While disposable vapes have seen a surge in popularity, there's also a growing trend towards more sustainable options like refillable pod systems and tanks. These devices offer users greater flexibility in choosing e-liquids and are generally considered more environmentally friendly in the long run.

The focus on user experience is driving many of these technological advancements, with manufacturers striving to create devices that are not only high-performing but also intuitive and enjoyable to use.`,
        is_featured: true,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1570039487050-40e6ab26bd2d?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'The Future of Vaping Technology: Trends for 2025',
        meta_description: 'Explore the cutting-edge technological advancements and trends that will shape the vaping industry in 2025 and beyond.',
      },
      {
        title: 'Beyond the Basics: Unveiling the Innovations Driving the Future of Vaping',
        slug: 'beyond-basics-innovations-future-vaping',
        summary: 'Take a deep dive into the sophisticated technologies transforming the vaping landscape, from AI integration to sustainable solutions.',
        content: `The vaping landscape is rapidly transforming, moving beyond simple devices to incorporate sophisticated technologies that enhance the user experience and address evolving consumer needs. In 2025, several key innovations are at the forefront of this evolution.

Smart vape technology is a major driving force. These devices are equipped with microprocessors and connectivity features that allow for a level of customization and control previously unavailable. Through smartphone apps, vapers can now fine-tune settings like wattage and temperature, monitor their usage patterns, and even receive alerts for maintenance. Some devices are even integrating artificial intelligence to learn user preferences and optimize performance automatically. Features like adjustable airflow and haptic feedback are also becoming more common.

Advancements in battery technology are crucial for the continued growth of the vaping industry. Expect to see more devices with improved battery efficiency, allowing for longer vaping sessions on a single charge. Rapid charging capabilities, often utilizing USB-C ports, are becoming standard, minimizing downtime. Some manufacturers are exploring innovative solutions like solar-powered pods to extend battery life.

Heating elements are also undergoing significant development. The shift towards ceramic and mesh coils is providing better flavor and vapor production compared to traditional coils. These new materials often heat more evenly and have a longer lifespan. Graphene coils represent another leap forward, offering ultra-fast heating and exceptional flavor delivery.

Sustainability is an increasingly important consideration in the vaping world. Innovations in this area include the use of biodegradable materials in device construction and more eco-friendly packaging. Recycling programs for vape devices and components are also gaining traction, reflecting a growing environmental consciousness within the industry.

Beyond hardware, e-liquid formulations are also evolving. The rise of nicotine-free vaping caters to users who enjoy the sensory experience without nicotine. Hybrid e-liquids, combining nicotine salts and freebase nicotine, offer a balanced and satisfying experience. Flavor development continues to be a key area of innovation, with manufacturers exploring more natural and complex flavor profiles.

These innovations, from smart features and advanced heating to sustainability efforts and evolving e-liquids, are collectively shaping the future of vaping, offering users more control, better performance, and a wider range of options than ever before.`,
        is_featured: false,
        is_published: true,
        featured_image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1044&q=80',
        meta_title: 'Advanced Vaping Innovations: The Next Generation',
        meta_description: 'Discover the cutting-edge innovations in vaping technology, from smart features and AI integration to sustainable solutions and advanced e-liquid formulations.',
      }
    ];

    // Insert the blog posts
    for (const post of blogPosts) {
      await db.insert(schema.blogPosts).values({
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        featured_image: post.featured_image,
        is_featured: post.is_featured,
        is_published: post.is_published,
        view_count: 0,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        created_at: new Date(),
        updated_at: new Date()
      }).execute();
    }

    console.log('Successfully seeded blog posts');
  } catch (error) {
    console.error('Error seeding blog posts:', error);
  }
}

seedBlogPosts().then(() => {
  console.log('Blog post seeding script completed');
  process.exit(0);
}).catch(error => {
  console.error('Error running seed script:', error);
  process.exit(1);
});