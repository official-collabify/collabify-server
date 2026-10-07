export const recordWorkspaceAccessTypeDefs = `
  type RecordWorkspaceAccessPayload {
    success: Boolean!
    workspaceSlug: String!
    projectSlug: String
    lastAccessedAt: String!
  }

  extend type Mutation {
    recordWorkspaceAccess(workspaceSlug: String!, projectSlug: String): RecordWorkspaceAccessPayload!
  }
`;
