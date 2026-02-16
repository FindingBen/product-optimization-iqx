import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

import {
  Page,
  Card,
  IndexTable,
  Button,
  Text,
  EmptyState,
} from "@shopify/polaris";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const qrcodes = await db.qRCode.findMany({
    where: { shop: session.shop },
    orderBy: { id: "desc" },
  });

  return { qrcodes };
}

export default function QRCodesIndex() {
  const { qrcodes } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page
      title="QR Codes"
      primaryAction={{
        content: "Create QR code",
        onAction: () => navigate("/app/qrcodes/new"),
      }}
    >
      <Card>
        {qrcodes.length === 0 ? (
          <EmptyState
            heading="Create your first QR code"
            action={{
              content: "Create QR code",
              onAction: () => navigate("/app/qrcodes/new"),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Generate QR codes for products or collections.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={{ singular: "QR code", plural: "QR codes" }}
            itemCount={qrcodes.length}
            headings={[
              { title: "Title" },
              { title: "Destination" },
            ]}
            selectable={false}
          >
            {qrcodes.map((qr, index) => (
              <IndexTable.Row
                id={qr.id}
                key={qr.id}
                position={index}
                onClick={() => navigate(`/app/qrcodes/${qr.id}`)}
              >
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {qr.title}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{qr.destination}</IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>
    </Page>
  );
}
