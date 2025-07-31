// Load environment variables first
import "../server/config";

import { db } from "../server/db";
import { 
  emailContacts, 
  emailLists, 
  contactTags, 
  contactListMemberships, 
  contactTagAssignments,
  tenants 
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedEmailContacts() {
  console.log("🌱 Seeding email contacts data...");

  try {
    // Get the default tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'default'))
      .limit(1);

    if (!tenant) {
      console.error("❌ Default tenant not found. Please run the main seed script first.");
      return;
    }

    const tenantId = tenant.id;
    console.log(`📍 Using tenant: ${tenant.name} (${tenantId})`);

    // Create email lists
    console.log("📋 Creating email lists...");
    const lists = await db
      .insert(emailLists)
      .values([
        {
          tenantId,
          name: "All Contacts",
          description: "All email contacts in the system",
        },
        {
          tenantId,
          name: "Premium Customers",
          description: "High-value paying customers",
        },
        {
          tenantId,
          name: "Newsletter Subscribers",
          description: "Users subscribed to our newsletter",
        },
        {
          tenantId,
          name: "Trial Users",
          description: "Users currently on free trial",
        },
        {
          tenantId,
          name: "Leads",
          description: "Potential customers and leads",
        },
        {
          tenantId,
          name: "Webinar Attendees",
          description: "People who attended our webinars",
        }
      ])
      .returning();

    console.log(`✅ Created ${lists.length} email lists`);

    // Create contact tags
    console.log("🏷️ Creating contact tags...");
    const tags = await db
      .insert(contactTags)
      .values([
        {
          tenantId,
          name: "customer",
          color: "#10B981", // Green
        },
        {
          tenantId,
          name: "premium",
          color: "#F59E0B", // Yellow
        },
        {
          tenantId,
          name: "lead",
          color: "#3B82F6", // Blue
        },
        {
          tenantId,
          name: "trial-user",
          color: "#8B5CF6", // Purple
        },
        {
          tenantId,
          name: "newsletter",
          color: "#06B6D4", // Cyan
        },
        {
          tenantId,
          name: "webinar-attendee",
          color: "#EC4899", // Pink
        },
        {
          tenantId,
          name: "high-value",
          color: "#DC2626", // Red
        },
        {
          tenantId,
          name: "engaged",
          color: "#059669", // Emerald
        }
      ])
      .returning();

    console.log(`✅ Created ${tags.length} contact tags`);

    // Create email contacts
    console.log("👥 Creating email contacts...");
    const contacts = await db
      .insert(emailContacts)
      .values([
        {
          tenantId,
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          status: "active",
          emailsSent: 24,
          emailsOpened: 18,
          addedDate: new Date("2025-03-15"),
          lastActivity: new Date("2025-07-28"),
        },
        {
          tenantId,
          email: "jane.smith@company.com",
          firstName: "Jane",
          lastName: "Smith",
          status: "active",
          emailsSent: 8,
          emailsOpened: 6,
          addedDate: new Date("2025-06-20"),
          lastActivity: new Date("2025-07-25"),
        },
        {
          tenantId,
          email: "mike.wilson@email.com",
          firstName: "Mike",
          lastName: "Wilson",
          status: "unsubscribed",
          emailsSent: 15,
          emailsOpened: 10,
          addedDate: new Date("2025-02-10"),
          lastActivity: new Date("2025-05-15"),
        },
        {
          tenantId,
          email: "sarah.jones@test.com",
          firstName: "Sarah",
          lastName: "Jones",
          status: "bounced",
          emailsSent: 3,
          emailsOpened: 0,
          addedDate: new Date("2025-07-01"),
          lastActivity: new Date("2025-07-10"),
        },
        {
          tenantId,
          email: "alex.brown@startup.io",
          firstName: "Alex",
          lastName: "Brown",
          status: "pending",
          emailsSent: 1,
          emailsOpened: 0,
          addedDate: new Date("2025-07-28"),
          lastActivity: null,
        },
        {
          tenantId,
          email: "emma.davis@corp.com",
          firstName: "Emma",
          lastName: "Davis",
          status: "active",
          emailsSent: 32,
          emailsOpened: 28,
          addedDate: new Date("2025-01-15"),
          lastActivity: new Date("2025-07-30"),
        },
        {
          tenantId,
          email: "david.miller@tech.co",
          firstName: "David",
          lastName: "Miller",
          status: "active",
          emailsSent: 12,
          emailsOpened: 9,
          addedDate: new Date("2025-05-10"),
          lastActivity: new Date("2025-07-29"),
        },
        {
          tenantId,
          email: "lisa.garcia@design.com",
          firstName: "Lisa",
          lastName: "Garcia",
          status: "active",
          emailsSent: 18,
          emailsOpened: 14,
          addedDate: new Date("2025-04-20"),
          lastActivity: new Date("2025-07-27"),
        },
        {
          tenantId,
          email: "robert.taylor@business.net",
          firstName: "Robert",
          lastName: "Taylor",
          status: "unsubscribed",
          emailsSent: 6,
          emailsOpened: 2,
          addedDate: new Date("2025-06-05"),
          lastActivity: new Date("2025-06-20"),
        },
        {
          tenantId,
          email: "maria.martinez@agency.io",
          firstName: "Maria",
          lastName: "Martinez",
          status: "active",
          emailsSent: 21,
          emailsOpened: 19,
          addedDate: new Date("2025-03-01"),
          lastActivity: new Date("2025-07-30"),
        },
        {
          tenantId,
          email: "contact@startup.example",
          firstName: null,
          lastName: null,
          status: "pending",
          emailsSent: 2,
          emailsOpened: 1,
          addedDate: new Date("2025-07-25"),
          lastActivity: new Date("2025-07-26"),
        },
        {
          tenantId,
          email: "team@freelance.dev",
          firstName: null,
          lastName: null,
          status: "active",
          emailsSent: 5,
          emailsOpened: 4,
          addedDate: new Date("2025-07-20"),
          lastActivity: new Date("2025-07-29"),
        }
      ])
      .returning();

    console.log(`✅ Created ${contacts.length} email contacts`);

    // Create contact-list relationships
    console.log("🔗 Creating contact-list memberships...");
    const allContactsList = lists.find(l => l.name === "All Contacts")!;
    const premiumList = lists.find(l => l.name === "Premium Customers")!;
    const newsletterList = lists.find(l => l.name === "Newsletter Subscribers")!;
    const trialList = lists.find(l => l.name === "Trial Users")!;
    const leadsList = lists.find(l => l.name === "Leads")!;
    const webinarList = lists.find(l => l.name === "Webinar Attendees")!;

    const listMemberships = [];
    
    // Add all contacts to "All Contacts"
    for (const contact of contacts) {
      listMemberships.push({
        tenantId,
        contactId: contact.id,
        listId: allContactsList.id,
      });
    }

    // Add specific contacts to specific lists
    const johnDoe = contacts.find(c => c.email === "john.doe@example.com")!;
    const janeSmith = contacts.find(c => c.email === "jane.smith@company.com")!;
    const emmaDavis = contacts.find(c => c.email === "emma.davis@corp.com")!;
    const davidMiller = contacts.find(c => c.email === "david.miller@tech.co")!;
    const lisaGarcia = contacts.find(c => c.email === "lisa.garcia@design.com")!;
    const mariaMartinez = contacts.find(c => c.email === "maria.martinez@agency.io")!;
    const alexBrown = contacts.find(c => c.email === "alex.brown@startup.io")!;
    const sarahJones = contacts.find(c => c.email === "sarah.jones@test.com")!;

    // Premium customers
    listMemberships.push(
      { tenantId, contactId: johnDoe.id, listId: premiumList.id },
      { tenantId, contactId: emmaDavis.id, listId: premiumList.id },
      { tenantId, contactId: mariaMartinez.id, listId: premiumList.id }
    );

    // Newsletter subscribers
    listMemberships.push(
      { tenantId, contactId: johnDoe.id, listId: newsletterList.id },
      { tenantId, contactId: janeSmith.id, listId: newsletterList.id },
      { tenantId, contactId: emmaDavis.id, listId: newsletterList.id },
      { tenantId, contactId: davidMiller.id, listId: newsletterList.id },
      { tenantId, contactId: lisaGarcia.id, listId: newsletterList.id }
    );

    // Trial users
    listMemberships.push(
      { tenantId, contactId: alexBrown.id, listId: trialList.id },
      { tenantId, contactId: contacts.find(c => c.email === "contact@startup.example")!.id, listId: trialList.id }
    );

    // Leads
    listMemberships.push(
      { tenantId, contactId: janeSmith.id, listId: leadsList.id },
      { tenantId, contactId: sarahJones.id, listId: leadsList.id },
      { tenantId, contactId: contacts.find(c => c.email === "team@freelance.dev")!.id, listId: leadsList.id }
    );

    // Webinar attendees
    listMemberships.push(
      { tenantId, contactId: janeSmith.id, listId: webinarList.id },
      { tenantId, contactId: davidMiller.id, listId: webinarList.id },
      { tenantId, contactId: lisaGarcia.id, listId: webinarList.id }
    );

    await db.insert(contactListMemberships).values(listMemberships);
    console.log(`✅ Created ${listMemberships.length} list memberships`);

    // Create contact-tag relationships
    console.log("🏷️ Creating contact-tag assignments...");
    const customerTag = tags.find(t => t.name === "customer")!;
    const premiumTag = tags.find(t => t.name === "premium")!;
    const leadTag = tags.find(t => t.name === "lead")!;
    const trialTag = tags.find(t => t.name === "trial-user")!;
    const newsletterTag = tags.find(t => t.name === "newsletter")!;
    const webinarTag = tags.find(t => t.name === "webinar-attendee")!;
    const highValueTag = tags.find(t => t.name === "high-value")!;
    const engagedTag = tags.find(t => t.name === "engaged")!;

    const tagAssignments = [
      // John Doe - customer, premium, newsletter, high-value, engaged
      { tenantId, contactId: johnDoe.id, tagId: customerTag.id },
      { tenantId, contactId: johnDoe.id, tagId: premiumTag.id },
      { tenantId, contactId: johnDoe.id, tagId: newsletterTag.id },
      { tenantId, contactId: johnDoe.id, tagId: highValueTag.id },
      { tenantId, contactId: johnDoe.id, tagId: engagedTag.id },

      // Jane Smith - lead, webinar-attendee
      { tenantId, contactId: janeSmith.id, tagId: leadTag.id },
      { tenantId, contactId: janeSmith.id, tagId: webinarTag.id },

      // Mike Wilson - customer (unsubscribed)
      { tenantId, contactId: contacts.find(c => c.email === "mike.wilson@email.com")!.id, tagId: customerTag.id },

      // Sarah Jones - lead
      { tenantId, contactId: sarahJones.id, tagId: leadTag.id },

      // Alex Brown - trial-user
      { tenantId, contactId: alexBrown.id, tagId: trialTag.id },

      // Emma Davis - customer, premium, newsletter, high-value, engaged
      { tenantId, contactId: emmaDavis.id, tagId: customerTag.id },
      { tenantId, contactId: emmaDavis.id, tagId: premiumTag.id },
      { tenantId, contactId: emmaDavis.id, tagId: newsletterTag.id },
      { tenantId, contactId: emmaDavis.id, tagId: highValueTag.id },
      { tenantId, contactId: emmaDavis.id, tagId: engagedTag.id },

      // David Miller - customer, newsletter, webinar-attendee
      { tenantId, contactId: davidMiller.id, tagId: customerTag.id },
      { tenantId, contactId: davidMiller.id, tagId: newsletterTag.id },
      { tenantId, contactId: davidMiller.id, tagId: webinarTag.id },

      // Lisa Garcia - customer, newsletter, webinar-attendee, engaged
      { tenantId, contactId: lisaGarcia.id, tagId: customerTag.id },
      { tenantId, contactId: lisaGarcia.id, tagId: newsletterTag.id },
      { tenantId, contactId: lisaGarcia.id, tagId: webinarTag.id },
      { tenantId, contactId: lisaGarcia.id, tagId: engagedTag.id },

      // Robert Taylor - customer (unsubscribed)
      { tenantId, contactId: contacts.find(c => c.email === "robert.taylor@business.net")!.id, tagId: customerTag.id },

      // Maria Martinez - customer, premium, high-value, engaged
      { tenantId, contactId: mariaMartinez.id, tagId: customerTag.id },
      { tenantId, contactId: mariaMartinez.id, tagId: premiumTag.id },
      { tenantId, contactId: mariaMartinez.id, tagId: highValueTag.id },
      { tenantId, contactId: mariaMartinez.id, tagId: engagedTag.id },

      // startup contact - trial-user
      { tenantId, contactId: contacts.find(c => c.email === "contact@startup.example")!.id, tagId: trialTag.id },

      // freelance team - lead
      { tenantId, contactId: contacts.find(c => c.email === "team@freelance.dev")!.id, tagId: leadTag.id },
    ];

    await db.insert(contactTagAssignments).values(tagAssignments);
    console.log(`✅ Created ${tagAssignments.length} tag assignments`);

    console.log("🎉 Email contacts mock data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • ${contacts.length} contacts`);
    console.log(`   • ${lists.length} email lists`);
    console.log(`   • ${tags.length} contact tags`);
    console.log(`   • ${listMemberships.length} list memberships`);
    console.log(`   • ${tagAssignments.length} tag assignments`);
    console.log("\n🚀 You can now visit /email-contacts to see the data!");

  } catch (error) {
    console.error("❌ Error seeding email contacts:", error);
    throw error;
  }
}

// Run the seed function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailContacts()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seedEmailContacts };