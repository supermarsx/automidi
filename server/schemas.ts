import { z } from 'zod';

export const SendMidiMessageSchema = z.object({
  type: z.literal('send'),
  port: z.string(),
  bytes: z.array(z.number().int().min(0).max(255)),
});

export const RunAppMessageSchema = z.object({
  type: z.literal('runApp'),
  app: z.string(),
});

export const RunShellMessageSchema = z.object({
  type: z.literal('runShell'),
  cmd: z.string(),
});

export const RunShellWinMessageSchema = z.object({
  type: z.literal('runShellWin'),
  cmd: z.string(),
});

export const RunShellBgMessageSchema = z.object({
  type: z.literal('runShellBg'),
  cmd: z.string(),
});

export const KeysTypeMessageSchema = z.object({
  type: z.literal('keysType'),
  sequence: z.array(z.string()),
  interval: z.number().int().nonnegative().optional(),
});

export const NotifyMessageSchema = z.object({
  type: z.literal('notify'),
  title: z.string().optional(),
  message: z.string(),
});

export const PingMessageSchema = z.object({
  type: z.literal('ping'),
  ts: z.number(),
});

export const GetDevicesMessageSchema = z.object({
  type: z.literal('getDevices'),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
  SendMidiMessageSchema,
  RunAppMessageSchema,
  RunShellMessageSchema,
  RunShellWinMessageSchema,
  RunShellBgMessageSchema,
  KeysTypeMessageSchema,
  NotifyMessageSchema,
  PingMessageSchema,
  GetDevicesMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
