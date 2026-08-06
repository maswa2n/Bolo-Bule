import type { LearningCaseVersion } from "@/types/learning";

export const seedCaseBank: LearningCaseVersion[] = [
  {
    id: 1001,
    caseId: "SCM-VENDOR-DELAY-001",
    versionNumber: 1,
    status: "published",
    title: {
      en: "Following Up a Delayed Delivery",
      id: "Menindaklanjuti Pengiriman Terlambat",
    },
    domain: "supply_chain",
    subdomain: "vendor_management",
    workFunction: "procurement",
    internalLevel: "intermediate",
    cefrLevel: "B1",
    userRole: "Procurement Officer",
    counterpartRole: "Vendor Representative",
    scenario: {
      en: "A critical spare part has not arrived according to schedule.",
      id: "Spare part kritis belum datang sesuai jadwal.",
    },
    communicationGoal: "Obtain a clear delivery commitment without becoming confrontational.",
    conversationPolicy: {
      minimumUserTurns: 4,
      targetUserTurns: 6,
      maximumUserTurns: 8,
      minimumPassScore: 70,
      requiredObjectiveCompletion: 1,
      allowRemedialTurns: true,
    },
    contentSource: "internal_case_library",
    objectives: [
      {
        objectiveCode: "CONFIRM_STATUS",
        description: "Confirm the current delivery status",
        required: true,
        weight: 20,
      },
      {
        objectiveCode: "EXPLAIN_IMPACT",
        description: "Explain the operational impact",
        required: true,
        weight: 25,
      },
      {
        objectiveCode: "REQUEST_COMMITMENT",
        description: "Request a specific delivery commitment",
        required: true,
        weight: 35,
      },
      {
        objectiveCode: "AGREE_FOLLOWUP",
        description: "Agree on the next follow-up",
        required: true,
        weight: 20,
      },
    ],
    languageTargets: {
      grammar: ["present perfect", "future commitment"],
      vocabulary: ["delivery schedule", "operational impact", "commitment", "expedite"],
      functionalLanguage: ["Could you confirm...", "This delay is affecting...", "Can you commit to..."],
    },
    turns: [
      {
        turnNumber: 1,
        objectiveCode: "CONFIRM_STATUS",
        coachMessageEn: "Could you confirm the current delivery status and shipment location?",
        coachMessageId: "Bisakah Anda konfirmasi status dan lokasi pengiriman saat ini?",
        responseSupport: [
          "Please share the latest tracking status.",
          "Could you confirm where the shipment is right now?",
          "We need factual status before we update operations.",
        ],
      },
      {
        turnNumber: 2,
        objectiveCode: "EXPLAIN_IMPACT",
        coachMessageEn: "How is this delay affecting your operations?",
        coachMessageId: "Bagaimana keterlambatan ini memengaruhi operasional Anda?",
        responseSupport: [
          "This delay is affecting planned maintenance.",
          "Our operations are on standby without this part.",
          "The project schedule may shift if it arrives late.",
        ],
      },
      {
        turnNumber: 3,
        objectiveCode: "REQUEST_COMMITMENT",
        coachMessageEn: "What delivery time can you commit to?",
        coachMessageId: "Kapan waktu pengiriman yang bisa Anda komitkan?",
        responseSupport: [
          "Can you commit delivery before 3 PM today?",
          "Please provide a specific confirmed delivery time.",
          "We need a firm commitment for today's arrival.",
        ],
      },
      {
        turnNumber: 4,
        objectiveCode: "AGREE_FOLLOWUP",
        coachMessageEn: "What follow-up channel and time should we use?",
        coachMessageId: "Kanal dan waktu follow-up apa yang kita pakai?",
        responseSupport: [
          "Let's agree on a written update at 2 PM.",
          "Please send a tracking update in our coordination group.",
          "Call immediately if there is any change in commitment.",
        ],
      },
    ],
  },
];
