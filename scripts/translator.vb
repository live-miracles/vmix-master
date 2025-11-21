' Script name: Translator
' This is a sidechain translator script, which monitors the mic/call input level
' and reduces the volume of Bus X when the translator is speaking.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Translator 0.0.1")

' Configuration
Dim loopTime = 200
Dim voiceThreshold As Double = 0.05
Dim silenceLimit As Integer = 2500
Dim volumeFull = 85
Dim volumeReduced = 50


Dim lastActiveTime As DateTime = DateTime.Now

Do While True
    Sleep(loopTime)

    Try
        ' Load vMix XML
        Dim inputs = API.XML()
        Dim xml = New System.Xml.XmlDocument()
        xml.LoadXml(inputs)

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'Translator')]")
        If micNode Is Nothing Then Continue Do

        Dim micLevel As Double = CDbl(micNode.Attributes("meterF1").Value)

        ' --- Translator Speaking ---
        If micLevel > voiceThreshold Then
            lastActiveTime = DateTime.Now
            API.Function("SetBusBVolumeFade", Value:="50,100")

        Else
            ' --- Translator is silent ---
            Dim elapsed As Double = (DateTime.Now - lastActiveTime).TotalMilliseconds

            If elapsed >= silenceLimit Then
                ' Restore Bus B to 100%
                API.Function("SetBusBVolumeFade", Value:="50,1000")
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Translator Script Error: " & ex.Message)
    End Try
Loop