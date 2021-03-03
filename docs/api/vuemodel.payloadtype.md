<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@tybys/vuemodel](./vuemodel.md) &gt; [PayloadType](./vuemodel.payloadtype.md)

## PayloadType type


<b>Signature:</b>

```typescript
export declare type PayloadType<T> = T extends IAction<infer AP, any> ? AP : (T extends IMutation<infer MP> ? MP : any);
```
<b>References:</b> [IAction](./vuemodel.iaction.md)<!-- -->, [IMutation](./vuemodel.imutation.md)
